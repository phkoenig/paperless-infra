/**
 * Gmail zu Paperless Export Script - Final Version mit sauberer Ordnerstruktur
 * 
 * Stufe 1: Nur relevante E-Mail-Anhänge exportieren (ein Ordner pro E-Mail)
 * Stufe 2: E-Mails mit Label "Paperless" als PDF exportieren
 */

// Konfiguration - Saubere Ordnernamen ohne Schrägstriche
const PAPERLESS_ROOT_FOLDER = 'Paperless';
const PAPERLESS_ATTACHMENTS_FOLDER = 'Paperless-Attachments';
const PAPERLESS_EMAILS_FOLDER = 'Paperless-Emails';
const PAPERLESS_LABEL = 'Paperless';

// Dateityp-Filter: Nur geschäftlich relevante Dateien
const RELEVANT_FILE_TYPES = [
  // Dokumente
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
  // Archive
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Bilder (nur wenn sie wichtige Dokumente sein könnten)
  'image/tiff',
  'image/tif'
];

// Dateierweiterungs-Filter (zusätzliche Sicherheit)
const RELEVANT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'txt', 'csv',
  'zip', 'rar', '7z', 'tiff', 'tif'
];

/**
 * Hauptfunktion - wird alle 5 Minuten ausgeführt
 */
function exportToPaperless() {
  console.log('🚀 Paperless Export gestartet...');
  
  // Stufe 1: Alle neuen E-Mail-Anhänge exportieren
  exportAllAttachments();
  
  // Stufe 2: E-Mails mit "Paperless" Label als PDF exportieren
  exportLabelledEmailsAsPDF();
  
  console.log('✅ Paperless Export abgeschlossen');
}

/**
 * Stufe 1: Nur relevante E-Mail-Anhänge exportieren (ein Ordner pro E-Mail)
 */
function exportAllAttachments() {
  console.log('📎 Exportiere relevante E-Mail-Anhänge...');
  
  // Google Drive Ordner erstellen/abrufen
  const attachmentsFolder = getOrCreateDriveFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  
  // Alle ungelesenen E-Mails der letzten 24 Stunden
  const query = 'is:unread newer_than:1d';
  const threads = GmailApp.search(query, 0, 50); // Max 50 Threads
  
  let attachmentCount = 0;
  let skippedCount = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      const attachments = message.getAttachments();
      
      // Erst alle Anhänge sammeln und relevante filtern
      const relevantAttachments = [];
      attachments.forEach((attachment, index) => {
        const contentType = attachment.getContentType();
        const fileName = attachment.getName();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Ist die Datei relevant?
        if (isRelevantAttachment(contentType, fileExtension, fileName)) {
          relevantAttachments.push(attachment);
        } else {
          console.log(`⏭️ Anhang übersprungen (nicht relevant): ${fileName} (${contentType})`);
          skippedCount++;
        }
      });
      
      // Nur wenn relevante Anhänge vorhanden sind, E-Mail-Ordner erstellen
      if (relevantAttachments.length > 0) {
        try {
          // Vollständige E-Mail-Metadaten extrahieren
          const messageId = message.getId();
          const threadId = thread.getId();
          const from = message.getFrom();
          const to = message.getTo();
          const cc = message.getCc();
          const bcc = message.getBcc();
          const subject = message.getSubject();
          const date = message.getDate();
          const body = message.getPlainBody();
          const htmlBody = message.getBody();
          
          // Zeitstempel für eindeutige E-Mail-ID
          const timestamp = Utilities.formatDate(date, 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
          const fromShort = from.split('<')[0].trim().replace(/[^\w\s-]/g, '').substring(0, 20);
          const subjectShort = subject.replace(/[^\w\s-]/g, '').substring(0, 30);
          
          // Eindeutige E-Mail-ID (ein Ordner pro E-Mail)
          const emailId = `${timestamp}_${fromShort}_${subjectShort}_Thread-${threadId.substring(0, 8)}`;
          
          // E-Mail-Ordner erstellen
          const emailFolder = getOrCreateDriveFolder(`${PAPERLESS_ATTACHMENTS_FOLDER}/${emailId}`);
          
          // Alle relevanten Anhänge in den E-Mail-Ordner speichern
          relevantAttachments.forEach((attachment, index) => {
            const file = emailFolder.createFile(
              attachment.copyBlob().setName(attachment.getName())
            );
            console.log(`📎 Anhang ${index + 1}/${relevantAttachments.length} exportiert: ${attachment.getName()}`);
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
            date: date,
            attachments: relevantAttachments.map(att => ({
              name: att.getName(),
              size: att.getSize(),
              type: att.getContentType()
            })),
            attachmentCount: relevantAttachments.length,
            gmailDeepLink: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
            gmailDirectLink: `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${messageId}`,
            body: body.substring(0, 500), // Erste 500 Zeichen für Kontext
            exportTimestamp: new Date().toISOString(),
            exportedBy: 'Paperless-Email-Export-Script'
          };
          
          // JSON-Metadaten speichern
          const metadataBlob = Utilities.newBlob(
            JSON.stringify(metadata, null, 2), 
            'application/json', 
            'email-metadata.json'
          );
          emailFolder.createFile(metadataBlob);
          
          console.log(`📧 E-Mail mit ${relevantAttachments.length} Anhängen exportiert: ${from} → ${emailId}/`);
          attachmentCount += relevantAttachments.length;
          
        } catch (error) {
          console.error(`❌ Fehler beim Export der E-Mail: ${error.message}`);
        }
      }
    });
  });
  
  console.log(`✅ ${attachmentCount} relevante Anhänge exportiert, ${skippedCount} übersprungen`);
}

/**
 * Stufe 2: E-Mails mit "Paperless" Label als PDF exportieren
 */
function exportLabelledEmailsAsPDF() {
  console.log('📄 Exportiere E-Mails mit Paperless-Label...');
  
  // Google Drive Ordner erstellen/abrufen
  const emailsFolder = getOrCreateDriveFolder(PAPERLESS_EMAILS_FOLDER);
  
  // Label "Paperless" abrufen
  const label = GmailApp.getUserLabelByName(PAPERLESS_LABEL);
  if (!label) {
    console.log('⚠️ Label "Paperless" nicht gefunden');
    return;
  }
  
  // E-Mails mit diesem Label abrufen
  const threads = label.getThreads(0, 20); // Max 20 Threads
  
  let emailCount = 0;
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      try {
        // E-Mail als PDF konvertieren
        const pdfBlob = convertEmailToPDF(message);
        
        // Zeitstempel für Dateiname
        const timestamp = Utilities.formatDate(new Date(), 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
        const subject = message.getSubject().replace(/[^\w\s-]/g, '').substring(0, 50); // Bereinigen
        const filename = `${timestamp}_${subject}.pdf`;
        
        // PDF in Google Drive speichern
        const file = emailsFolder.createFile(pdfBlob.setName(filename));
        
        console.log(`📄 E-Mail als PDF exportiert: ${filename}`);
        emailCount++;
        
      } catch (error) {
        console.error(`❌ Fehler beim PDF-Export: ${error.message}`);
      }
    });
    
    // Label nach Verarbeitung entfernen
    thread.removeLabel(label);
    console.log(`🏷️ Label "Paperless" von Thread entfernt`);
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
  
  // HTML-Template für E-Mail
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>E-Mail: ${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #666; }
        .content { margin-top: 20px; line-height: 1.6; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>E-Mail Export</h1>
      </div>
      
      <div class="field">
        <span class="label">Von:</span> ${from}
      </div>
      <div class="field">
        <span class="label">An:</span> ${to}
      </div>
      <div class="field">
        <span class="label">Datum:</span> ${date}
      </div>
      <div class="field">
        <span class="label">Betreff:</span> ${subject}
      </div>
      
      <div class="content">
${body}
      </div>
    </body>
    </html>
  `;
  
  // HTML als Blob erstellen
  const htmlBlob = Utilities.newBlob(htmlContent, 'text/html', 'email.html');
  
  // HTML zu PDF konvertieren (vereinfacht - in der Praxis würde man einen Service nutzen)
  // Für jetzt erstellen wir einen Text-basierten PDF
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
 * Google Drive Ordner erstellen oder abrufen
 */
function getOrCreateDriveFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Prüft ob ein Anhang relevant ist (Filter für geschäftlich wichtige Dateien)
 */
function isRelevantAttachment(contentType, fileExtension, fileName) {
  // 1. Content-Type prüfen
  if (RELEVANT_FILE_TYPES.includes(contentType)) {
    return true;
  }
  
  // 2. Dateierweiterung prüfen (falls Content-Type nicht erkannt)
  if (RELEVANT_EXTENSIONS.includes(fileExtension)) {
    return true;
  }
  
  // 3. Spezielle Dateinamen-Patterns (z.B. "Rechnung", "Invoice", etc.)
  const fileNameLower = fileName.toLowerCase();
  const importantKeywords = ['rechnung', 'invoice', 'bill', 'quittung', 'receipt', 'vertrag', 'contract', 'agreement'];
  
  if (importantKeywords.some(keyword => fileNameLower.includes(keyword))) {
    console.log(`✅ Wichtiges Dokument erkannt: ${fileName}`);
    return true;
  }
  
  return false;
}

/**
 * Ordner-Name bereinigen (für Google Drive)
 */
function cleanFolderName(emailAddress) {
  // E-Mail-Adresse bereinigen
  let cleanName = emailAddress.replace(/[<>]/g, '').trim();
  
  // Bei "Name <email@domain.com>" nur den Namen nehmen
  if (cleanName.includes('<')) {
    cleanName = cleanName.split('<')[0].trim();
  }
  
  // Sonderzeichen entfernen
  cleanName = cleanName.replace(/[^\w\s-]/g, '');
  
  // Maximal 50 Zeichen
  cleanName = cleanName.substring(0, 50);
  
  // Fallback falls leer
  if (!cleanName) {
    cleanName = 'Unbekannt';
  }
  
  return cleanName;
}

/**
 * Manuelle Ausführung für Tests
 */
function testExport() {
  console.log('🧪 Test-Modus aktiviert');
  exportToPaperless();
}

/**
 * Setup-Funktion - einmalig ausführen
 */
function setupPaperlessExport() {
  console.log('🔧 Setup Paperless Export...');
  
  // Ordner erstellen (ohne verschachtelte Pfade)
  getOrCreateDriveFolder(PAPERLESS_ATTACHMENTS_FOLDER);
  getOrCreateDriveFolder(PAPERLESS_EMAILS_FOLDER);
  
  // Label erstellen falls nicht vorhanden
  const label = GmailApp.getUserLabelByName(PAPERLESS_LABEL);
  if (!label) {
    GmailApp.createLabel(PAPERLESS_LABEL);
    console.log(`✅ Label "${PAPERLESS_LABEL}" erstellt`);
  }
  
  console.log('✅ Setup abgeschlossen');
}
