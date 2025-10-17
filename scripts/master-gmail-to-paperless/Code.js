/**
 * Gmail zu Paperless Export Script - MASTER VERSION v4.2
 * 
 * NEU in v4.2 (.eml Export mit eml2pdf):
 * - E-Mails werden als .eml gespeichert (RFC 2822 Standard - enthält ALLE Header!)
 * - Server konvertiert .eml → PDF via eml2pdf + Gotenberg
 * - Vereinfachte Metadata (nur Paperless-spezifische Daten)
 * - Einheitliche Ordnerstruktur: E-Mail + Anhänge + metadata.json pro Ordner
 * - Performance-Optimierung: Filter-Listen nur einmal laden
 * 
 * NEU in v4.1:
 * - RFC Message-ID Extraktion (weltweit eindeutig)
 * - SHA-256 Hashes für Anhänge (Duplikaterkennung)
 * - Verbesserte Metadata-Struktur
 * 
 * NEU in v4:
 * - Intelligenter Filter mit Supabase Whitelist/Blacklist
 * - KI-gestützte Bewertung (Google Gemini)
 * - Logging aller Entscheidungen
 * 
 * UNIVERSAL: Funktioniert für ALLE Google Accounts
 * - philip@zepta.com (ZEPTA Workspace)
 * - phkoenig@gmail.com (Privat)
 * 
 * STRUKTUR:
 * Paperless-Emails/
 * └── [timestamp]_[sender]_[subject]/
 *     ├── email.eml              # RAW E-Mail (ALLE Header!)
 *     ├── email-metadata.json    # Filter-Entscheidung, SHA-256, Links
 *     └── attachment-*.xyz       # Anhänge (falls vorhanden)
 */

// ============================================
// KONFIGURATION
// ============================================

// VERSION
const SCRIPT_VERSION = 'v4.2.1';
const SCRIPT_NAME = 'Paperless-Email-Export-Script-Master';
const FULL_VERSION = `${SCRIPT_NAME}-${SCRIPT_VERSION}`;

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
 * Zeigt Version und Account-Info an
 * Führe diese Funktion aus, um zu sehen welche Version deployed ist!
 */
function showVersion() {
  const userEmail = Session.getActiveUser().getEmail();
  console.log('╔════════════════════════════════════════════╗');
  console.log(`║  📦 ${SCRIPT_NAME}  ║`);
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Version: ${SCRIPT_VERSION.padEnd(32)} ║`);
  console.log(`║  Account: ${userEmail.padEnd(32)} ║`);
  console.log(`║  Zeitfilter: letzte 30 Tage               ║`);
  console.log(`║  Duplikaterkennung: Supabase Index       ║`);
  console.log('╚════════════════════════════════════════════╝');
  
  return {
    version: SCRIPT_VERSION,
    scriptName: SCRIPT_NAME,
    account: userEmail,
    timeFilter: '30d',
    deduplication: 'Supabase paperless_documents_index'
  };
}

/**
 * Hauptfunktion - wird alle 5 Minuten ausgeführt
 */
function exportToPaperless() {
  const userEmail = Session.getActiveUser().getEmail();
  const startTime = new Date().getTime();
  console.log(`🚀 Paperless Export ${SCRIPT_VERSION} gestartet für ${userEmail}...`);
  
  // Filter-Listen aus Supabase laden (nur EINMAL für Performance!)
  const filterLists = loadFilterLists();
  
  // NEU: Einheitlicher Export (E-Mails + Anhänge in einem Schritt)
  // Speichert als .eml + metadata.json + Anhänge pro E-Mail-Ordner
  exportFilteredEmails(filterLists);
  
  const elapsed = (new Date().getTime() - startTime) / 1000;
  console.log(`✅ Paperless Export abgeschlossen in ${elapsed}s`);
}

/**
 * Stufe 1: ALLE E-Mail-Anhänge exportieren (mit intelligentem Filter!)
 */
function exportAllAttachments(filterLists) {
  console.log('📎 Exportiere E-Mail-Anhänge (mit intelligentem Filter)...');
  
  const attachmentsRootFolder = getOrCreateFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  const query = 'newer_than:30d';  // 30 Tage - unabhängig von gelesen/ungelesen
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
          const rfcMessageId = extractRFCMessageID(message);  // ← NEU: RFC-Standard
          const gmailMessageId = message.getId();              // Gmail-intern (Backup)
          const threadId = thread.getId();
          const from = message.getFrom();
          const to = message.getTo();
          const cc = message.getCc();
          const bcc = message.getBcc();
          const subject = message.getSubject();
          const date = message.getDate();
          const body = message.getPlainBody();
          
          // ======== DUPLIKAT-CHECK (NEU v4.2) ========
          const duplicateCheck = isDuplicateInPaperless(message);
          
          if (duplicateCheck.isDuplicate) {
            console.log(`🔁 DUPLIKAT übersprungen: ${subject.substring(0, 50)} (bereits in Paperless)`);
            return; // ← Verhindert Upload von bekannten Duplikaten
          }
          // ==========================================
          
          // Eindeutige E-Mail-Ordner-ID
          const timestamp = Utilities.formatDate(date, 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
          const fromShort = cleanString(from.split('<')[0].trim()).substring(0, 20);
          const subjectShort = cleanString(subject).substring(0, 30);
          const emailFolderId = `${timestamp}_${fromShort}_${subjectShort}`;
          
          // Prüfen ob Ordner bereits existiert (verhindert lokale Duplikate)
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
          
          // E-Mail-Metadaten als JSON erstellen (v4.1 mit RFC Message-ID + SHA-256)
          const metadata = {
            // RFC-Standard IDs (weltweit eindeutig)
            messageId: rfcMessageId,                    // ← NEU: RFC Message-ID
            messageIdType: 'rfc2822',
            
            // Gmail-spezifische IDs (als Backup)
            gmailMessageId: gmailMessageId,
            gmailThreadId: threadId,
            
            // E-Mail-Daten
            from: from,
            to: to,
            cc: cc,
            bcc: bcc,
            subject: subject,
            date: date.toISOString(),
            bodyPreview: body.substring(0, 500),
            
            // Anhänge mit SHA-256 Hashes
            attachments: relevantAttachments.map(att => createAttachmentMetadata(att)),  // ← NEU: Mit SHA-256
            attachmentCount: relevantAttachments.length,
            
            // Links & Referenzen
            gmailDeepLink: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
            gmailDirectLink: `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${rfcMessageId}`,
            
            // Export-Info
            exportTimestamp: new Date().toISOString(),
            exportedBy: FULL_VERSION,
            exportedFrom: Session.getActiveUser().getEmail(),
            
            // Filter-Entscheidung
            filterDecision: filterDecision,
            
            // Version & Schema
            metadataVersion: '4.1',
            schemaType: 'paperless-email-export'
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
          
          // ======== INDEX-REGISTRIERUNG (NEU v4.2) ========
          // Registriere in Supabase paperless_documents_index
          const attachmentMetadata = relevantAttachments.map(att => createAttachmentMetadata(att));
          registerInPaperlessIndex(message, attachmentMetadata, emailFolder.getId());
          // ================================================
          
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
 * Stufe 2: Alle E-Mails exportieren (mit intelligentem Filter)
 * Speichert als .eml + metadata.json (+ Anhänge falls vorhanden)
 */
function exportFilteredEmails(filterLists) {
  console.log('📧 Exportiere alle E-Mails der letzten 30 Tage...');
  
  const emailsRootFolder = getOrCreateFolder(PAPERLESS_EMAILS_FOLDER);
  
  // ALLE E-Mails der letzten 30 Tage (ohne is:unread Filter - findet gelesen & ungelesen!)
  const searchQuery = 'newer_than:30d';
  const threads = GmailApp.search(searchQuery, 0, 200);
  
  console.log(`🔍 ${threads.length} E-Mail-Threads gefunden`);
  
  let emailCount = 0;
  let filteredCount = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      const startTime = new Date().getTime();
      
      try {
        // ======== INTELLIGENTER FILTER ========
        const filterDecision = shouldExportEmail(message, filterLists);
        
        if (!filterDecision.shouldExport) {
          filteredCount++;
          console.log(`🚫 Gefiltert: ${message.getSubject().substring(0, 50)} (${filterDecision.reason})`);
          logFilterDecision(message, filterDecision, startTime);
          return; // ← E-Mail wird NICHT exportiert
        }
        
        console.log(`✅ Export: ${message.getSubject().substring(0, 50)} (${filterDecision.reason})`);
        // ======================================
        
        // ======== DUPLIKAT-CHECK (NEU v4.2) ========
        const duplicateCheck = isDuplicateInPaperless(message);
        
        if (duplicateCheck.isDuplicate) {
          console.log(`🔁 DUPLIKAT übersprungen: ${message.getSubject().substring(0, 50)} (bereits in Paperless)`);
          return; // ← Verhindert Upload von bekannten Duplikaten
        }
        // ==========================================
        
        // E-Mail-Ordner ID erstellen
        const timestamp = Utilities.formatDate(message.getDate(), 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
        const fromShort = cleanString(message.getFrom().split('<')[0].trim()).substring(0, 20);
        const subjectShort = cleanString(message.getSubject()).substring(0, 30);
        const emailFolderId = `${timestamp}_${fromShort}_${subjectShort}`;
        
        // Prüfen ob Ordner bereits existiert (verhindert lokale Duplikate)
        if (folderExists(emailsRootFolder, emailFolderId)) {
          console.log(`⏭️ Ordner bereits vorhanden: ${emailFolderId}`);
          return;
        }
        
        // E-Mail-Unterordner erstellen
        const emailFolder = getOrCreateSubFolder(emailsRootFolder, emailFolderId);
        
        // 1. E-Mail als .eml speichern (enthält ALLE Header!)
        const emlData = saveEmailAsEML(message);
        emailFolder.createFile(emlData.blob);
        console.log(`📧 EML gespeichert: ${emlData.filename}`);
        
        // 2. Anhänge speichern (falls vorhanden)
        const attachments = message.getAttachments();
        const relevantAttachments = [];
        
        attachments.forEach(attachment => {
          const contentType = attachment.getContentType();
          const fileName = attachment.getName();
          const fileExtension = fileName.split('.').pop().toLowerCase();
          
          if (isRelevantAttachment(contentType, fileExtension, fileName)) {
            relevantAttachments.push(attachment);
            emailFolder.createFile(attachment.copyBlob().setName(attachment.getName()));
            console.log(`📎 Anhang gespeichert: ${attachment.getName()}`);
          }
        });
        
        // 3. Vereinfachte Metadata speichern (nur unsere zusätzlichen Daten)
        const rfcMessageId = extractRFCMessageID(message);
        const metadata = {
          // Paperless-spezifische Metadaten (nicht in .eml enthalten)
          exportTimestamp: new Date().toISOString(),
          exportedBy: FULL_VERSION,
          exportedFrom: Session.getActiveUser().getEmail(),
          
          // Filter-Entscheidung
          filterDecision: filterDecision,
          
          // Anhänge mit SHA-256 Hashes
          attachments: relevantAttachments.map(att => createAttachmentMetadata(att)),
          attachmentCount: relevantAttachments.length,
          
          // Gmail-Links (zum Zurückverfolgen)
          gmailDeepLink: `https://mail.google.com/mail/u/0/#inbox/${thread.getId()}`,
          gmailDirectLink: `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${rfcMessageId}`,
          
          // Version
          metadataVersion: '4.1',
          schemaType: 'paperless-email-export',
          
          // Hinweis: E-Mail-Header (From, To, Subject, Date, Message-ID, etc.) sind in der .eml Datei!
          note: 'All email headers (From, To, Subject, Date, Message-ID, Thread-ID) are preserved in the .eml file'
        };
        
        // JSON speichern
        const metadataBlob = Utilities.newBlob(
          JSON.stringify(metadata, null, 2), 
          'application/json', 
          'email-metadata.json'
        );
        emailFolder.createFile(metadataBlob);
        
        console.log(`✅ E-Mail exportiert: ${emailFolderId}/ (.eml + ${relevantAttachments.length} Anhänge)`);
        emailCount++;
        
        // ======== INDEX-REGISTRIERUNG (NEU v4.2) ========
        // Registriere in Supabase paperless_documents_index
        const attachmentMetadata = relevantAttachments.map(att => createAttachmentMetadata(att));
        registerInPaperlessIndex(message, attachmentMetadata, emailFolder.getId());
        // ================================================
        
        // Log zu Supabase
        logFilterDecision(message, filterDecision, startTime);
        
      } catch (error) {
        console.error(`❌ E-Mail-Export Fehler: ${error.message}`);
      }
    });
  });
  
  console.log(`✅ ${emailCount} E-Mails exportiert, ${filteredCount} gefiltert`);
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
// HELPER-FUNKTIONEN - RFC Message-ID & SHA-256 (NEU in v4.1)
// ============================================

/**
 * Extrahiert RFC-konforme Message-ID aus E-Mail Header
 * Diese ID ist weltweit eindeutig und systemübergreifend
 */
function extractRFCMessageID(message) {
  try {
    // Versuche RFC Message-ID aus Raw Content zu extrahieren
    const rawContent = message.getRawContent();
    const messageIdMatch = rawContent.match(/^Message-ID:\s*<(.+?)>/im);
    
    if (messageIdMatch && messageIdMatch[1]) {
      return messageIdMatch[1];
    }
    
    // Fallback: Gmail-interne ID (wenn RFC Message-ID nicht verfügbar)
    console.warn('⚠️ Keine RFC Message-ID gefunden, verwende Gmail-ID');
    return 'gmail-' + message.getId();
    
  } catch (error) {
    console.error(`❌ Fehler bei Message-ID Extraktion: ${error.message}`);
    return 'gmail-' + message.getId();
  }
}

/**
 * Berechnet SHA-256 Hash für Anhang (Duplikaterkennung)
 */
function calculateSHA256(blob) {
  try {
    const bytes = blob.getBytes();
    const hashBytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, 
      bytes
    );
    
    // Konvertiere zu Hex-String
    return hashBytes.map(function(byte) {
      const hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
  } catch (error) {
    console.error(`❌ SHA-256 Berechnung fehlgeschlagen: ${error.message}`);
    return null;
  }
}

/**
 * Erstellt erweiterte Attachment-Metadata mit Hash
 */
function createAttachmentMetadata(attachment) {
  const sha256 = calculateSHA256(attachment);
  
  return {
    name: attachment.getName(),
    size: attachment.getSize(),
    type: attachment.getContentType(),
    sha256: sha256,
    hash_algorithm: 'SHA-256'
  };
}

// ============================================
// DUPLIKAT-ERKENNUNG (NEU v4.2)
// ============================================

/**
 * Prüft ob E-Mail bereits in Paperless importiert wurde
 * Verhindert Duplikate BEVOR sie hochgeladen werden
 * 
 * @param {GmailMessage} message - Gmail Message Objekt
 * @returns {Object} { isDuplicate: boolean, reason: string, existingEntry: object }
 */
function isDuplicateInPaperless(message) {
  try {
    const rfcMessageId = extractRFCMessageID(message);
    
    if (!rfcMessageId) {
      console.warn('⚠️ Keine RFC Message-ID gefunden - kann nicht auf Duplikate prüfen');
      return { isDuplicate: false, reason: 'no_message_id' };
    }
    
    // Prüfe gegen Supabase paperless_documents_index
    const url = `${SUPABASE_URL}/rest/v1/paperless_documents_index?rfc_message_id=eq.${encodeURIComponent(rfcMessageId)}&select=*`;
    
    const options = {
      method: 'get',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    if (statusCode === 200) {
      const results = JSON.parse(response.getContentText());
      
      if (results.length > 0) {
        const existing = results[0];
        console.log(`🔁 DUPLIKAT gefunden: Message-ID bereits in Paperless (ID: ${existing.paperless_id || 'pending'})`);
        return {
          isDuplicate: true,
          reason: 'message_id_exists',
          existingEntry: existing
        };
      }
    }
    
    // Kein Duplikat gefunden
    return { isDuplicate: false, reason: 'new_document' };
    
  } catch (error) {
    console.error(`❌ Duplikat-Check fehlgeschlagen: ${error.message}`);
    // Bei Fehler: Lieber durchlassen als blockieren
    return { isDuplicate: false, reason: 'check_failed', error: error.message };
  }
}

/**
 * Registriert E-Mail in Supabase paperless_documents_index
 * Wird aufgerufen NACH dem Upload zu Google Drive
 * 
 * @param {GmailMessage} message - Gmail Message Objekt
 * @param {Array} attachments - Array von Attachment-Objekten mit SHA-256
 * @param {String} googleDriveFolderId - Google Drive Ordner-ID
 */
function registerInPaperlessIndex(message, attachments, googleDriveFolderId) {
  try {
    const rfcMessageId = extractRFCMessageID(message);
    
    if (!rfcMessageId) {
      console.warn('⚠️ Keine RFC Message-ID - kann nicht in Index registrieren');
      return;
    }
    
    // SHA-256 Hashes extrahieren
    const sha256Hashes = attachments
      .map(att => att.sha256)
      .filter(hash => hash !== null);
    
    // Entry für Supabase erstellen
    const indexEntry = {
      rfc_message_id: rfcMessageId,
      gmail_message_id: message.getId(),
      gmail_thread_id: message.getThread().getId(),
      sha256_hashes: sha256Hashes,
      paperless_id: null, // Wird später von Paperless MCP aktualisiert
      email_from: message.getFrom(),
      email_subject: message.getSubject(),
      has_attachments: attachments.length > 0,
      attachment_count: attachments.length,
      source_account: Session.getActiveUser().getEmail(),
      google_drive_folder_id: googleDriveFolderId,
      notes: 'Registered by Apps Script v4.2 after upload'
    };
    
    // Insert in Supabase
    const url = `${SUPABASE_URL}/rest/v1/paperless_documents_index`;
    
    const options = {
      method: 'post',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(indexEntry),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    if (statusCode === 201) {
      console.log(`✅ In Paperless-Index registriert: ${rfcMessageId}`);
    } else {
      console.warn(`⚠️ Index-Registrierung fehlgeschlagen (${statusCode}): ${response.getContentText()}`);
    }
    
  } catch (error) {
    console.error(`❌ Index-Registrierung fehlgeschlagen: ${error.message}`);
    // Nicht kritisch - E-Mail wurde trotzdem hochgeladen
  }
}

// ============================================
// HELPER-FUNKTIONEN (Original)
// ============================================

/**
 * Speichert E-Mail als .eml Datei (RFC 2822 Standard)
 * Die .eml Datei enthält ALLE E-Mail-Header und wird später von eml2pdf zu PDF konvertiert
 */
function saveEmailAsEML(message) {
  try {
    // Hole RAW E-Mail Content (komplettes .eml Format mit allen Headern)
    const rawContent = message.getRawContent();
    
    // Erstelle .eml Blob
    const timestamp = Utilities.formatDate(message.getDate(), 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
    const subject = cleanString(message.getSubject()).substring(0, 50);
    const filename = `${timestamp}_${subject}.eml`;
    
    const emlBlob = Utilities.newBlob(rawContent, 'message/rfc822', filename);
    
    return { blob: emlBlob, filename: filename };
    
  } catch (error) {
    console.error(`❌ Fehler beim EML-Export: ${error.message}`);
    throw error;
  }
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
  console.log('🔧 Setup Paperless Export v4.2 Master...');
  
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
  
  console.log('✅ Setup v4.2 Master abgeschlossen (.eml Export aktiviert)');
}

function testExport() {
  console.log('🧪 Test-Modus aktiviert (v4.2 Master - .eml Export)');
  exportToPaperless();
}

/**
 * Debug: Test .eml Export einzeln
 */
function debugEMLExport() {
  console.log('🔍 Debug: Teste .eml Export...');
  
  // Erste E-Mail aus Inbox holen
  const threads = GmailApp.getInboxThreads(0, 1);
  if (threads.length === 0) {
    console.log('❌ Keine E-Mails im Posteingang');
    return;
  }
  
  const message = threads[0].getMessages()[0];
  console.log('📧 E-Mail gefunden:', message.getSubject());
  
  try {
    // .eml erstellen
    const emlData = saveEmailAsEML(message);
    console.log('✅ EML erstellt:', emlData.filename);
    
    // Google Drive Ordner
    const folder = getOrCreateFolder('Paperless-Emails');
    console.log('📁 Ordner gefunden:', folder.getName());
    
    // Datei speichern
    const file = folder.createFile(emlData.blob);
    console.log('✅ Datei gespeichert:', file.getName(), file.getUrl());
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error('Stack:', error.stack);
  }
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
