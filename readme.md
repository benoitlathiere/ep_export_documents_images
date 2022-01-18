ep_export_documents_images
======
Etherpad-Lite plugin to export the pad in a PDF/ODT/Doc file with images using Open/LibreOffice. This module is part of an academic project.


## Settings

#### Global setting used ("setting.json"):

- "loglevel": verbose levels used in server-side console during the export.

##### Optional settings in your 'settings.json' file:

	"ep_export_documents_images" : {
		"soffice": "", //(string) path to soffice command. If empty, default is 'soffice'.
		"keywords": "", //(string) keywords in headers (PDF and ODT).
		"author": "", //(string) author in headers (PDF and ODT). Set to "auto" to use the "title" global setting.
		"title": "", //(string) document title (PDF and ODT). You can use '%s' to refer to the pad Id (ie: "Document generated from the %s session.").
		"remove_LOdir": false,	//(boolean) remove or not the special LibreOffice folder (/tmp/LibOconversion/)  (version 0.0.4). Default value: false, not recreate it each conversion is more efficient.
		"verbose_log": false	//(boolean) activate or not verbose server log (version 0.0.5). Default value: false.
	}


## News
0.0.6:

- Added pad ID and current date in the filename.
- Fixed bug : styling was removed during export.
- Fixed bug : if missing or wrong settings.

0.0.5:

- New setting ("verbose_log"=true) in settings.json to activate or not verbose mode in server log.
- Japanese language added (Thanks to Keiji Ono from Japan).
- Italian language added.
- Portuguese and Brazilian languages added.
- A FAQ document added to solve common problems.

0.0.4:

- New setting ("remove_LOdir"=false) in settings.json to choose to remove the special LibreOffice folder after conversion.
- German translation file added.

0.0.3:

- Fixed bug when another Office instance is running. A limited Office installation is created in "/tmp/LibO_Conversion/".

0.0.2:

- Fixed some bugs if no setting specified in settigns.json. Settings are now optionals.
- Homepage link added in the package.json.
- Menus translated : English, French, Spanish.

0.0.1:

- First [alpha] version.


## Roadmap

- OpenXML (Word 2007) export is broken so it's not available for now.
- Do/test conversions on Windows servers.
- Check if command from settings file exists.
- Import documents using Office to avoid using Abiword.
- Improve translations (help needed).
- Fix bug with multi-byte characters (Japanese, Chinese, ...). (help needed).
- Retrieve auto-generated Youtube thumbnails to replace linked videos.


## Bugs
Send me an email with bug description and your context (Linux distribution and versions...).


## Author
Benoit Lathiere - benoit.lathiere@gmail.com
