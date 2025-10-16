/**
 * Gmail zu Paperless Export Script - MASTER VERSION v3
 * 
 * Exportiert BOTH: E-Mail-Bodies UND Anhänge
 * 
 * UNIVERSAL: Funktioniert für ALLE Google Accounts
 * - philip@zepta.com (ZEPTA Workspace)
 * - phkoenig@gmail.com (Privat)
 * 
 * Struktur:
 * Google Drive/
 *   ├─ Paperless-Attachments/
 *   │   ├─ 2025-10-15_Email-1/
 *   │   │   ├─ attachment1.pdf
 *   │   │   ├─ attachment2.docx
 *   │   │   └─ email-metadata.json
 *   │   └─ 2025-10-15_Email-2/
 *   └─ Paperless-Emails/
 *       ├─ 2025-10-15_Email.pdf (nur Body)
 *       └─ ...
 */

// Konfiguration
const PAPERLESS_ATTACHMENTS_FOLDER = 'Paperless-Attachments';
const PAPERLESS_EMAILS_FOLDER = 'Paperless-Emails';
const PAPERLESS_LABEL = 'Paperless';

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
  'zip', 'rar', '7z', 'tiff', 'tif'
];

/**
 * Hauptfunktion - wird alle 5 Minuten ausgeführt
 */
function exportToPaperless() {
  const userEmail = Session.getActiveUser().getEmail();
  console.log(`🚀 Paperless Export gestartet für ${userEmail}...`);
  
  // Stufe 1: ALLE E-Mail-Anhänge exportieren (auch ohne Label)
  exportAllAttachments();
  
  // Stufe 2: E-Mails mit "Paperless" Label als PDF exportieren
  exportLabelledEmailsAsPDF();
  
  console.log('✅ Paperless Export abgeschlossen');
}

/**
 * Stufe 1: ALLE E-Mail-Anhänge exportieren (ein Ordner pro E-Mail)
 */
function exportAllAttachments() {
  console.log('📎 Exportiere ALLE E-Mail-Anhänge...');
  
  // Root-Ordner für Attachments
  const attachmentsRootFolder = getOrCreateFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  
  // ALLE E-Mails der letzten 7 Tage (nicht nur ungelesene!)
  const query = 'newer_than:7d';
  const threads = GmailApp.search(query, 0, 100); // Mehr Threads
  
  let attachmentCount = 0;
  let skippedCount = 0;
  let processedEmails = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
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
            exportedBy: 'Paperless-Email-Export-Script-v3-Master',
            exportedFrom: Session.getActiveUser().getEmail()
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
          
        } catch (error) {
          console.error(`❌ Fehler beim Export: ${error.message}`);
        }
      }
    });
  });
  
  console.log(`✅ ${processedEmails} E-Mails verarbeitet, ${attachmentCount} Anhänge exportiert, ${skippedCount} übersprungen`);
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

/**
 * E-Mail als PDF konvertieren
 */
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

/**
 * Root-Ordner abrufen/erstellen
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Unterordner erstellen (für E-Mail-Ordner)
 */
function getOrCreateSubFolder(parentFolder, subFolderName) {
  const subFolders = parentFolder.getFoldersByName(subFolderName);
  
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(subFolderName);
  }
}

/**
 * Prüft ob Ordner existiert
 */
function folderExists(parentFolder, folderName) {
  const subFolders = parentFolder.getFoldersByName(folderName);
  return subFolders.hasNext();
}

/**
 * Prüft ob Datei existiert
 */
function fileExists(parentFolder, fileName) {
  const files = parentFolder.getFilesByName(fileName);
  return files.hasNext();
}

/**
 * Prüft ob ein Anhang relevant ist
 */
function isRelevantAttachment(contentType, fileExtension, fileName) {
  // Content-Type prüfen
  if (RELEVANT_FILE_TYPES.includes(contentType)) {
    return true;
  }
  
  // Dateierweiterung prüfen
  if (RELEVANT_EXTENSIONS.includes(fileExtension)) {
    return true;
  }
  
  // Wichtige Keywords im Dateinamen
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

/**
 * String bereinigen (für Dateinamen)
 */
function cleanString(str) {
  return str
    .replace(/[^\w\s-]/g, '')  // Sonderzeichen entfernen
    .replace(/\s+/g, '_')       // Leerzeichen durch Unterstriche ersetzen
    .trim();
}

/**
 * Setup-Funktion - einmalig ausführen
 */
function setupPaperlessExport() {
  console.log('🔧 Setup Paperless Export v3 Master...');
  
  getOrCreateFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  getOrCreateFolder(PAPERLESS_EMAILS_FOLDER);
  
  const label = GmailApp.getUserLabelByName(PAPERLESS_LABEL);
  if (!label) {
    GmailApp.createLabel(PAPERLESS_LABEL);
    console.log(`✅ Label "${PAPERLESS_LABEL}" erstellt`);
  }
  
  console.log('✅ Setup v3 Master abgeschlossen');
}

/**
 * Manuelle Test-Funktion
 */
function testExport() {
  console.log('🧪 Test-Modus aktiviert (v3 Master)');
  exportToPaperless();
}

/**
 * Debug-Funktion: Zeige E-Mails mit Anhängen
 */
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

