/**
 * Gmail zu Paperless Export Script - MASTER VERSION v4
 * 
 * NEU in v4:
 * - Intelligenter Filter mit Supabase Whitelist/Blacklist
 * - KI-gestützte Bewertung (Google Gemini)
 * - Logging aller Entscheidungen
 * 
 * UNIVERSAL: Funktioniert für ALLE Google Accounts
 * - philip@zepta.com (ZEPTA Workspace)
 * - phkoenig@gmail.com (Privat)
 */

// ============================================
// KONFIGURATION
// ============================================

const PAPERLESS_ATTACHMENTS_FOLDER = 'Paperless-Attachments';
const PAPERLESS_EMAILS_FOLDER = 'Paperless-Emails';
const PAPERLESS_LABEL = 'Paperless';

// Supabase Configuration
const SUPABASE_URL = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';

// Google Gemini API (Optional - für KI-Bewertung)
const GEMINI_API_KEY = ''; // Später einfügen

// Dateityp-Filter
const RELEVANT_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'image/tiff',
  'image/tif'
];

const RELEVANT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'txt', 'csv',
  'zip', 'rar', '7z', 'tiff', 'tif', 'dwg', 'rvt'
];

// ============================================
// HAUPT-FUNKTIONEN
// ============================================

/**
 * Hauptfunktion - wird alle 5 Minuten ausgeführt
 */
function exportToPaperless() {
  const userEmail = Session.getActiveUser().getEmail();
  const startTime = new Date().getTime();
  console.log(`🚀 Paperless Export v4 gestartet für ${userEmail}...`);
  
  // Filter-Listen aus Supabase laden (Cache für Performance)
  const filterLists = loadFilterLists();
  
  // Stufe 1: ALLE E-Mail-Anhänge exportieren (mit Filter!)
  exportAllAttachments(filterLists);
  
  // Stufe 2: E-Mails mit "Paperless" Label als PDF exportieren
  exportLabelledEmailsAsPDF();
  
  const elapsed = (new Date().getTime() - startTime) / 1000;
  console.log(`✅ Paperless Export abgeschlossen in ${elapsed}s`);
}

/**
 * Stufe 1: ALLE E-Mail-Anhänge exportieren (mit intelligentem Filter!)
 */
function exportAllAttachments(filterLists) {
  console.log('📎 Exportiere E-Mail-Anhänge (mit intelligentem Filter)...');
  
  const attachmentsRootFolder = getOrCreateFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  const query = 'newer_than:7d';
  const threads = GmailApp.search(query, 0, 100);
  
  let attachmentCount = 0;
  let skippedCount = 0;
  let filteredCount = 0;
  let processedEmails = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      const startTime = new Date().getTime();
      
      // ======== INTELLIGENTER FILTER ========
      const filterDecision = shouldExportEmail(message, filterLists);
      
      if (!filterDecision.shouldExport) {
        filteredCount++;
        console.log(`🚫 Gefiltert: ${message.getSubject()} (${filterDecision.reason})`);
        
        // Log zu Supabase
        logFilterDecision(message, filterDecision, startTime);
        return; // ← E-Mail wird NICHT exportiert
      }
      
      console.log(`✅ Export: ${message.getSubject()} (${filterDecision.reason})`);
      // ======================================
      
      const attachments = message.getAttachments();
      
      // Relevante Anhänge filtern
      const relevantAttachments = [];
      attachments.forEach(attachment => {
        const contentType = attachment.getContentType();
        const fileName = attachment.getName();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (isRelevantAttachment(contentType, fileExtension, fileName)) {
          relevantAttachments.push(attachment);
        } else {
          skippedCount++;
        }
      });
      
      // Nur wenn relevante Anhänge vorhanden sind
      if (relevantAttachments.length > 0) {
        try {
          // E-Mail-Metadaten extrahieren
          const messageId = message.getId();
          const threadId = thread.getId();
          const from = message.getFrom();
          const to = message.getTo();
          const cc = message.getCc();
          const bcc = message.getBcc();
          const subject = message.getSubject();
          const date = message.getDate();
          const body = message.getPlainBody();
          
          // Eindeutige E-Mail-Ordner-ID
          const timestamp = Utilities.formatDate(date, 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
          const fromShort = cleanString(from.split('<')[0].trim()).substring(0, 20);
          const subjectShort = cleanString(subject).substring(0, 30);
          const emailFolderId = `${timestamp}_${fromShort}_${subjectShort}`;
          
          // Prüfen ob Ordner bereits existiert (verhindert Duplikate)
          if (folderExists(attachmentsRootFolder, emailFolderId)) {
            console.log(`⏭️ Ordner bereits vorhanden: ${emailFolderId}`);
            return;
          }
          
          // E-Mail-Unterordner erstellen
          const emailFolder = getOrCreateSubFolder(attachmentsRootFolder, emailFolderId);
          
          // Alle relevanten Anhänge in den E-Mail-Ordner speichern
          relevantAttachments.forEach(attachment => {
            emailFolder.createFile(attachment.copyBlob().setName(attachment.getName()));
            console.log(`📎 Exportiert: ${emailFolderId}/${attachment.getName()}`);
            attachmentCount++;
          });
          
          // E-Mail-Metadaten als JSON erstellen
          const metadata = {
            messageId: messageId,
            threadId: threadId,
            from: from,
            to: to,
            cc: cc,
            bcc: bcc,
            subject: subject,
            date: date.toISOString(),
            attachments: relevantAttachments.map(att => ({
              name: att.getName(),
              size: att.getSize(),
              type: att.getContentType()
            })),
            attachmentCount: relevantAttachments.length,
            gmailDeepLink: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
            gmailDirectLink: `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${messageId}`,
            bodyPreview: body.substring(0, 500),
            exportTimestamp: new Date().toISOString(),
            exportedBy: 'Paperless-Email-Export-Script-v4-Master',
            exportedFrom: Session.getActiveUser().getEmail(),
            filterDecision: filterDecision
          };
          
          // JSON speichern
          const metadataBlob = Utilities.newBlob(
            JSON.stringify(metadata, null, 2), 
            'application/json', 
            'email-metadata.json'
          );
          emailFolder.createFile(metadataBlob);
          
          console.log(`✅ E-Mail exportiert: ${emailFolderId}/ (${relevantAttachments.length} Anhänge)`);
          processedEmails++;
          
          // Log zu Supabase
          logFilterDecision(message, filterDecision, startTime);
          
        } catch (error) {
          console.error(`❌ Fehler beim Export: ${error.message}`);
        }
      }
    });
  });
  
  console.log(`✅ ${processedEmails} E-Mails exportiert, ${filteredCount} gefiltert, ${attachmentCount} Anhänge, ${skippedCount} übersprungen`);
}

/**
 * Stufe 2: E-Mails mit "Paperless" Label als PDF exportieren
 */
function exportLabelledEmailsAsPDF() {
  console.log('📄 Exportiere E-Mails mit Paperless-Label...');
  
  const emailsFolder = getOrCreateFolder(PAPERLESS_EMAILS_FOLDER);
  
  const label = GmailApp.getUserLabelByName(PAPERLESS_LABEL);
  if (!label) {
    console.log('⚠️ Label "Paperless" nicht gefunden');
    return;
  }
  
  const threads = label.getThreads(0, 20);
  let emailCount = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      try {
        // Prüfen ob bereits exportiert
        const timestamp = Utilities.formatDate(message.getDate(), 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
        const subject = cleanString(message.getSubject()).substring(0, 50);
        const filename = `${timestamp}_${subject}.pdf`;
        
        if (fileExists(emailsFolder, filename)) {
          console.log(`⏭️ E-Mail bereits exportiert: ${filename}`);
          return;
        }
        
        const pdfBlob = convertEmailToPDF(message);
        emailsFolder.createFile(pdfBlob.setName(filename));
        console.log(`📄 E-Mail als PDF exportiert: ${filename}`);
        emailCount++;
        
      } catch (error) {
        console.error(`❌ PDF-Export Fehler: ${error.message}`);
      }
    });
    
    thread.removeLabel(label);
  });
  
  console.log(`✅ ${emailCount} E-Mails als PDF exportiert`);
}

// ============================================
// INTELLIGENTER FILTER (NEU in v4)
// ============================================

/**
 * Entscheidet ob E-Mail exportiert werden soll
 */
function shouldExportEmail(message, filterLists) {
  const from = message.getFrom().toLowerCase();
  const subject = message.getSubject().toLowerCase();
  const body = message.getPlainBody().substring(0, 500).toLowerCase();
  const attachments = message.getAttachments();
  const hasAttachments = attachments.length > 0;
  
  // STUFE 1: User hat "Paperless" Label gesetzt → IMMER EXPORTIEREN
  const labels = message.getThread().getLabels().map(l => l.getName());
  if (labels.includes(PAPERLESS_LABEL)) {
    return {
      shouldExport: true,
      reason: 'User-Label "Paperless" gesetzt',
      score: 10,
      matchedRules: ['user-label']
    };
  }
  
  // STUFE 2: Blacklist-Check → SOFORT ABLEHNEN
  const blacklistMatch = checkBlacklist(from, subject, body, filterLists.blacklist);
  if (blacklistMatch) {
    return {
      shouldExport: false,
      reason: `Blacklist: ${blacklistMatch}`,
      score: 0,
      matchedRules: ['blacklist']
    };
  }
  
  // STUFE 3: Whitelist-Check → SOFORT AKZEPTIEREN
  const whitelistMatch = checkWhitelist(from, subject, attachments, filterLists.whitelist);
  if (whitelistMatch) {
    return {
      shouldExport: true,
      reason: `Whitelist: ${whitelistMatch.reason}`,
      score: whitelistMatch.priority,
      matchedRules: whitelistMatch.matchedRules
    };
  }
  
  // STUFE 4: Keine Anhänge → ABLEHNEN
  if (!hasAttachments) {
    return {
      shouldExport: false,
      reason: 'Keine Anhänge vorhanden',
      score: 2,
      matchedRules: ['no-attachments']
    };
  }
  
  // STUFE 5: KI-Bewertung für Grenzfälle
  if (GEMINI_API_KEY) {
    const aiScore = evaluateWithAI(message);
    if (aiScore >= 7) {
      return {
        shouldExport: true,
        reason: 'KI-Bewertung positiv',
        score: aiScore,
        matchedRules: ['ai-approval']
      };
    }
  }
  
  // DEFAULT: Im Zweifel NICHT exportieren
  return {
    shouldExport: false,
    reason: 'Keine Whitelist-Treffer, keine hohe KI-Bewertung',
    score: 4,
    matchedRules: ['default-reject']
  };
}

/**
 * Prüft Blacklist
 */
function checkBlacklist(from, subject, body, blacklist) {
  for (const item of blacklist) {
    const keyword = item.keyword.toLowerCase();
    
    switch (item.category) {
      case 'sender':
      case 'domain':
        if (from.includes(keyword)) {
          return keyword;
        }
        break;
      case 'subject':
        if (subject.includes(keyword)) {
          return keyword;
        }
        break;
      case 'body':
        if (body.includes(keyword)) {
          return keyword;
        }
        break;
    }
  }
  return null;
}

/**
 * Prüft Whitelist
 */
function checkWhitelist(from, subject, attachments, whitelist) {
  const matchedRules = [];
  let highestPriority = 0;
  let bestReason = '';
  
  for (const item of whitelist) {
    const keyword = item.keyword.toLowerCase();
    let matched = false;
    
    switch (item.category) {
      case 'sender':
      case 'domain':
        if (from.includes(keyword)) {
          matched = true;
        }
        break;
      case 'subject':
        if (subject.toLowerCase().includes(keyword)) {
          matched = true;
        }
        break;
      case 'attachment':
        attachments.forEach(att => {
          const fileName = att.getName().toLowerCase();
          if (fileName.includes(keyword)) {
            matched = true;
          }
        });
        break;
    }
    
    if (matched) {
      matchedRules.push(keyword);
      if (item.priority > highestPriority) {
        highestPriority = item.priority;
        bestReason = `${item.category}: ${keyword}`;
      }
    }
  }
  
  if (matchedRules.length > 0) {
    return {
      reason: bestReason,
      priority: highestPriority,
      matchedRules: matchedRules
    };
  }
  
  return null;
}

/**
 * KI-Bewertung mit Google Gemini (optional)
 */
function evaluateWithAI(message) {
  if (!GEMINI_API_KEY) {
    return 5; // Neutral Score wenn keine KI verfügbar
  }
  
  try {
    const prompt = `
Bewerte diese E-Mail auf einer Skala von 0-10, ob sie archivierungswürdig für ein professionelles Dokumentenmanagementsystem ist.

Von: ${message.getFrom()}
Betreff: ${message.getSubject()}
Anhänge: ${message.getAttachments().length}

Kriterien:
- 10: Rechnungen, Verträge, Behördenpost, wichtige Geschäftsdokumente
- 7-9: Projektbezogen, mit wichtigen Anhängen
- 4-6: Normale Geschäftskorrespondenz
- 0-3: Newsletter, Marketing, Notifications

Antworte NUR mit einer Zahl 0-10.
`;

    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    
    const result = JSON.parse(response.getContentText());
    const scoreText = result.candidates[0].content.parts[0].text.trim();
    const score = parseFloat(scoreText);
    
    return isNaN(score) ? 5 : Math.min(10, Math.max(0, score));
    
  } catch (error) {
    console.error(`❌ KI-Bewertung fehlgeschlagen: ${error.message}`);
    return 5; // Neutral bei Fehler
  }
}

/**
 * Lädt Filter-Listen aus Supabase
 */
function loadFilterLists() {
  try {
    // Blacklist laden
    const blacklistResponse = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/email_filter_blacklist?active=eq.true&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const blacklist = JSON.parse(blacklistResponse.getContentText());
    
    // Whitelist laden
    const whitelistResponse = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/email_filter_whitelist?active=eq.true&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const whitelist = JSON.parse(whitelistResponse.getContentText());
    
    console.log(`📋 Filter geladen: ${blacklist.length} Blacklist, ${whitelist.length} Whitelist`);
    
    return { blacklist, whitelist };
    
  } catch (error) {
    console.error(`❌ Supabase-Verbindung fehlgeschlagen: ${error.message}`);
    // Fallback: Leere Listen (exportiert nichts außer mit "Paperless" Label)
    return { blacklist: [], whitelist: [] };
  }
}

/**
 * Loggt Filter-Entscheidung zu Supabase
 */
function logFilterDecision(message, decision, startTime) {
  try {
    const processingTime = new Date().getTime() - startTime;
    const attachments = message.getAttachments();
    
    const logData = {
      email_from: message.getFrom(),
      email_to: message.getTo(),
      email_subject: message.getSubject(),
      has_attachments: attachments.length > 0,
      attachment_count: attachments.length,
      attachment_types: attachments.map(a => a.getContentType()),
      decision: decision.shouldExport ? 'export' : 'skip',
      reason: decision.reason,
      matched_rules: decision.matchedRules,
      ai_score: decision.score,
      processing_time_ms: processingTime,
      google_account: Session.getActiveUser().getEmail()
    };
    
    UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/email_filter_decisions`,
      {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        payload: JSON.stringify(logData)
      }
    );
    
  } catch (error) {
    // Logging-Fehler sind nicht kritisch
    console.warn(`⚠️ Logging fehlgeschlagen: ${error.message}`);
  }
}

// ============================================
// HELPER-FUNKTIONEN (wie vorher)
// ============================================

function convertEmailToPDF(message) {
  const subject = message.getSubject();
  const from = message.getFrom();
  const to = message.getTo();
  const date = message.getDate();
  const body = message.getPlainBody();
  
  const pdfContent = `
E-Mail Export
=============

Von: ${from}
An: ${to}
Datum: ${date}
Betreff: ${subject}

Inhalt:
${body}
  `;
  
  return Utilities.newBlob(pdfContent, 'application/pdf', 'email.pdf');
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  const subFolders = parentFolder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(subFolderName);
  }
}

function folderExists(parentFolder, folderName) {
  const subFolders = parentFolder.getFoldersByName(folderName);
  return subFolders.hasNext();
}

function fileExists(parentFolder, fileName) {
  const files = parentFolder.getFilesByName(fileName);
  return files.hasNext();
}

function isRelevantAttachment(contentType, fileExtension, fileName) {
  if (RELEVANT_FILE_TYPES.includes(contentType)) {
    return true;
  }
  if (RELEVANT_EXTENSIONS.includes(fileExtension)) {
    return true;
  }
  const fileNameLower = fileName.toLowerCase();
  const importantKeywords = [
    'rechnung', 'invoice', 'bill', 'quittung', 'receipt', 
    'vertrag', 'contract', 'agreement', 'angebot', 'offer',
    'plan', 'drawing', 'zeichnung', 'specification', 'spezi'
  ];
  if (importantKeywords.some(keyword => fileNameLower.includes(keyword))) {
    return true;
  }
  return false;
}

function cleanString(str) {
  return str
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// ============================================
// SETUP & TEST FUNKTIONEN
// ============================================

function setupPaperlessExport() {
  console.log('🔧 Setup Paperless Export v4 Master...');
  
  getOrCreateFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  getOrCreateFolder(PAPERLESS_EMAILS_FOLDER);
  
  const label = GmailApp.getUserLabelByName(PAPERLESS_LABEL);
  if (!label) {
    GmailApp.createLabel(PAPERLESS_LABEL);
    console.log(`✅ Label "${PAPERLESS_LABEL}" erstellt`);
  }
  
  // Test Supabase Connection
  const filterLists = loadFilterLists();
  console.log(`✅ Supabase verbunden: ${filterLists.blacklist.length} Blacklist, ${filterLists.whitelist.length} Whitelist`);
  
  console.log('✅ Setup v4 Master abgeschlossen');
}

function testExport() {
  console.log('🧪 Test-Modus aktiviert (v4 Master)');
  exportToPaperless();
}

function debugEmailsWithAttachments() {
  console.log('🔍 Debug: E-Mails mit Anhängen...');
  
  const query = 'newer_than:30d has:attachment';
  const threads = GmailApp.search(query, 0, 20);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const attachments = message.getAttachments();
      if (attachments.length > 0) {
        console.log(`📧 ${message.getFrom()} - "${message.getSubject()}" (${attachments.length} Anhänge)`);
        attachments.forEach(att => {
          console.log(`  📎 ${att.getName()} (${att.getContentType()})`);
        });
      }
    });
  });
}

/**
 * Test Filter-System
 */
function testFilter() {
  console.log('🧪 Test: Intelligenter Filter...');
  
  const filterLists = loadFilterLists();
  const query = 'newer_than:3d';
  const threads = GmailApp.search(query, 0, 10);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const decision = shouldExportEmail(message, filterLists);
      const emoji = decision.shouldExport ? '✅' : '🚫';
      console.log(`${emoji} ${message.getSubject().substring(0, 50)}`);
      console.log(`   Grund: ${decision.reason} (Score: ${decision.score})`);
    });
  });
}
