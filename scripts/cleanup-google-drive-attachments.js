/**
 * 🗑️ Google Drive Cleanup Script
 * 
 * ZWECK: Löscht den veralteten "Paperless-Attachments" Ordner
 * 
 * HINTERGRUND:
 * - Vor v4.2: Zwei separate Ordner (Paperless-Emails & Paperless-Attachments)
 * - Ab v4.2: Nur noch ein Ordner (Paperless-Emails mit Anhängen drin)
 * - Dieser Script räumt die Legacy-Ordner auf
 * 
 * VERWENDUNG:
 * 1. Öffne Google Apps Script Editor
 * 2. Erstelle neues Script mit diesem Code
 * 3. Führe "cleanupLegacyAttachmentsFolder()" aus
 * 4. Überprüfe Status mit "checkCleanupStatus()"
 * 
 * SICHERHEIT:
 * - Ordner werden NUR in den Papierkorb verschoben (nicht permanent gelöscht!)
 * - Du kannst sie innerhalb 30 Tagen wiederherstellen
 * - Paperless-Emails Ordner wird NICHT angerührt!
 * 
 * @author Philip König
 * @version 1.0
 * @date 2025-10-18
 */

// ============================================
// KONFIGURATION
// ============================================

const LEGACY_FOLDER_NAME = 'Paperless-Attachments';
const CURRENT_FOLDER_NAME = 'Paperless-Emails';

// ============================================
// HAUPT-FUNKTIONEN
// ============================================

/**
 * 🗑️ Löscht den veralteten Paperless-Attachments Ordner
 * SAFE: Verschiebt nur in Papierkorb, kein permanentes Löschen!
 */
function cleanupLegacyAttachmentsFolder() {
  console.log('🗑️ LEGACY CLEANUP GESTARTET');
  console.log('='.repeat(50));
  console.log(`Ziel: "${LEGACY_FOLDER_NAME}" Ordner löschen`);
  console.log('='.repeat(50));
  
  try {
    // Suche nach Paperless-Attachments Ordner
    const folders = DriveApp.getFoldersByName(LEGACY_FOLDER_NAME);
    
    let deletedCount = 0;
    
    while (folders.hasNext()) {
      const folder = folders.next();
      const folderId = folder.getId();
      const folderUrl = folder.getUrl();
      
      // Prüfe Anzahl der Unterordner
      const subFolders = [];
      const subFoldersIterator = folder.getFolders();
      while (subFoldersIterator.hasNext()) {
        subFolders.push(subFoldersIterator.next());
      }
      
      const fileCount = countFilesRecursively(folder);
      
      console.log(`\n📂 Gefunden: "${folder.getName()}"`);
      console.log(`   ID: ${folderId}`);
      console.log(`   URL: ${folderUrl}`);
      console.log(`   Unterordner: ${subFolders.length}`);
      console.log(`   Dateien (rekursiv): ${fileCount}`);
      
      // Sicherheitsabfrage
      if (subFolders.length > 0 || fileCount > 0) {
        console.log(`\n⚠️  WARNUNG: Ordner enthält ${subFolders.length} Unterordner und ${fileCount} Dateien!`);
        console.log(`   Diese werden in den Papierkorb verschoben (wiederherstellbar innerhalb 30 Tagen)`);
      }
      
      // In Papierkorb verschieben
      folder.setTrashed(true);
      deletedCount++;
      
      console.log(`\n✅ Ordner in Papierkorb verschoben!`);
      console.log(`   Wiederherstellung: Google Drive → Papierkorb → "${folder.getName()}" → Wiederherstellen`);
    }
    
    if (deletedCount === 0) {
      console.log(`\n✨ Kein "${LEGACY_FOLDER_NAME}" Ordner gefunden - bereits sauber!`);
    } else {
      console.log(`\n🎉 CLEANUP ABGESCHLOSSEN!`);
      console.log(`   Gelöscht: ${deletedCount} Legacy-Ordner`);
    }
    
    // Status nach Cleanup
    console.log('\n' + '='.repeat(50));
    console.log('📊 AKTUELLER STATUS:');
    checkCleanupStatus();
    
    return {
      success: true,
      deletedFolders: deletedCount,
      message: `${deletedCount} Legacy-Ordner in Papierkorb verschoben`
    };
    
  } catch (error) {
    console.error('❌ FEHLER beim Cleanup:', error.message);
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 🔍 Status Check - Zeigt aktuelle Ordner-Struktur
 */
function checkCleanupStatus() {
  console.log('🔍 GOOGLE DRIVE ORDNER STATUS');
  console.log('='.repeat(50));
  
  try {
    // Paperless-Emails (aktuell)
    const currentFolders = DriveApp.getFoldersByName(CURRENT_FOLDER_NAME);
    let currentCount = 0;
    while (currentFolders.hasNext()) {
      const folder = currentFolders.next();
      currentCount++;
      
      const subFolders = [];
      const subFoldersIterator = folder.getFolders();
      while (subFoldersIterator.hasNext()) {
        subFolders.push(subFoldersIterator.next());
      }
      
      console.log(`\n✅ "${CURRENT_FOLDER_NAME}" (AKTUELL)`);
      console.log(`   URL: ${folder.getUrl()}`);
      console.log(`   E-Mail Ordner: ${subFolders.length}`);
    }
    
    // Paperless-Attachments (legacy)
    const legacyFolders = DriveApp.getFoldersByName(LEGACY_FOLDER_NAME);
    let legacyCount = 0;
    while (legacyFolders.hasNext()) {
      const folder = legacyFolders.next();
      legacyCount++;
      
      const subFolders = [];
      const subFoldersIterator = folder.getFolders();
      while (subFoldersIterator.hasNext()) {
        subFolders.push(subFoldersIterator.next());
      }
      
      console.log(`\n⚠️  "${LEGACY_FOLDER_NAME}" (VERALTET!)`);
      console.log(`   URL: ${folder.getUrl()}`);
      console.log(`   Attachment Ordner: ${subFolders.length}`);
      console.log(`   → Sollte gelöscht werden!`);
    }
    
    // Zusammenfassung
    console.log('\n' + '='.repeat(50));
    if (legacyCount === 0) {
      console.log('✨ PERFEKT! Nur noch der aktuelle Ordner vorhanden.');
    } else {
      console.log(`⚠️  WARNUNG: ${legacyCount} Legacy-Ordner gefunden!`);
      console.log('   Führe "cleanupLegacyAttachmentsFolder()" aus zum Aufräumen.');
    }
    
    return {
      currentFolders: currentCount,
      legacyFolders: legacyCount,
      cleanupNeeded: legacyCount > 0
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Status Check:', error.message);
    return { error: error.message };
  }
}

/**
 * 🔄 Wiederherstellung aus Papierkorb
 * Falls du den Ordner versehentlich gelöscht hast
 */
function restoreLegacyFolder() {
  console.log('🔄 WIEDERHERSTELLUNG');
  console.log('='.repeat(50));
  console.log('⚠️  Diese Funktion kann Ordner NICHT automatisch wiederherstellen!');
  console.log('\nMANUELLE WIEDERHERSTELLUNG:');
  console.log('1. Öffne Google Drive (drive.google.com)');
  console.log('2. Klicke links auf "Papierkorb"');
  console.log(`3. Suche nach "${LEGACY_FOLDER_NAME}"`);
  console.log('4. Rechtsklick → "Wiederherstellen"');
  console.log('\nOrdner ist 30 Tage lang wiederherstellbar!');
}

// ============================================
// HELPER FUNKTIONEN
// ============================================

/**
 * Zählt Dateien rekursiv in einem Ordner
 */
function countFilesRecursively(folder) {
  let count = 0;
  
  // Dateien im aktuellen Ordner
  const filesIterator = folder.getFiles();
  while (filesIterator.hasNext()) {
    filesIterator.next();
    count++;
  }
  
  // Rekursiv in Unterordner
  const foldersIterator = folder.getFolders();
  while (foldersIterator.hasNext()) {
    const subFolder = foldersIterator.next();
    count += countFilesRecursively(subFolder);
  }
  
  return count;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * BEISPIEL 1: Status prüfen (safe, ändert nichts)
 */
function example_checkStatus() {
  checkCleanupStatus();
}

/**
 * BEISPIEL 2: Legacy-Ordner aufräumen
 */
function example_cleanup() {
  // 1. Status prüfen
  const status = checkCleanupStatus();
  
  // 2. Cleanup durchführen (falls nötig)
  if (status.cleanupNeeded) {
    cleanupLegacyAttachmentsFolder();
  } else {
    console.log('✨ Kein Cleanup nötig - alles sauber!');
  }
}

