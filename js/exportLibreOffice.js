/**
 * @author Benoit Lathiere
 * @licence GPL v2
 * @module ep_export_documents_images
 */
var ep_export_documents_images = (function(){
	var myModule = require("../package.json");
	var padManager = require("ep_etherpad-lite/node/db/PadManager");
	var exporthtml = require("ep_etherpad-lite/node/utils/ExportHtml");
	var settings = require("ep_etherpad-lite/node/utils/Settings");
	var child_process = require("child_process");
	var os = require("os");
	var fs = require("fs");
	var tempDirectory = "/tmp";
	var officePath='soffice';
	var verbose_log=false;
	var getRealCommand = function(command){
		var link = fs.lstat(command,function(err,stats){
			if(err){
				console.warn(err);
			}else{
				if(stats.isSymbolicLink()){
					getRealCommand(command);
				}else{
					console.info("fin: "+command);
				}
			}
		});
	};
	//check conf
	if(os.type().indexOf("Windows") > -1){
		tempDirectory = process.env.TEMP;
	}
	if (settings.ep_export_documents_images!==undefined) {
		if (settings.ep_export_documents_images.verbose_log && (settings.ep_export_documents_images.verbose_log===true || settings.ep_export_documents_images.verbose_log===false)){
			verbose_log=settings.ep_export_documents_images.verbose_log;
		}
		//soffice path, v0.0.7:
		var commande = 'which '+(settings.ep_export_documents_images.soffice.length>0?settings.ep_export_documents_images.soffice.trim():officePath);
		child_process.exec(commande,function(error,stoud,sterr){
			if(error){
				if ( (settings.loglevel==='ERROR' || settings.loglevel==='DEBUG') && verbose_log){
					console.error("erreur commande incorrecte: "+commande);
					console.error(sterr);
				}
			}else if(stoud!==null){
				stoud=stoud.trim();
				officePath = stoud;
				if ( (settings.loglevel==='INFO' || settings.loglevel==='DEBUG') && verbose_log){
					console.info(myModule.name+": soffice command found: "+stoud);
				}
				getRealCommand(officePath);
			}
		});
	}
	/**
	 * Using this soffice parameter to avoid bug if office is already running. (v0.0.4).<br />
	 * Source : http://ask.libreoffice.org/en/question/1686/how-to-not-connect-to-a-running-instance/
	 * Source : http://ask.libreoffice.org/en/question/2641/convert-to-command-line-parameter/
	 */
	var LO_tmp_dir= tempDirectory+"/LibO_Conversion";	//FIXME add 'process.env.USER' to LO path ?
	/** options for LibreOffice :
	 * command : {'abiword'| office'}. The tool which do the conversion. Path is not checked.
	 * extension: file output extension.
	 * filter: sometimes need to set the required filter /!\ don't forget the colon at the beginning /!\,  see http://ask.libreoffice.org/en/question/2641/convert-to-command-line-parameter/
	 * meta: sometimes, need to set some required metas to avoid first blank page !
	 * */
	var remove_LOdir=false;
	//functions
	var removeFile = function(file) {
		if (fs.existsSync(file)) {
			if ( (settings.loglevel==='INFO' || settings.loglevel==='DEBUG') && verbose_log){
				console.info("we delete this temp file : " + file);
			}
			try{
				fs.unlink(file,function(err){
					if(err && verbose_log){
						console.error("can't delete this temp file: "+file);
					}
				});
			}catch(e){
				if(verbose_log){
					console.error("can't delete this temp file: "+file);
				}
			}
		}
	};
	/**
	 * Remove recursively a directory and all sub-directories.
	 * Source: http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
	 */
	var removeDir = function(dir) {
		fs.stat(dir, function(err,stats){
			if(err!==null && verbose_log){
				console.error("can't access this temp folder: "+dir+ " / error: "+err);
				return("erreur");
			}else{
				fs.readdirSync(dir).forEach(function(file, index) {
					var curPath = dir + "/" + file;
					if (fs.statSync(curPath).isDirectory()) {
						removeDir(curPath);
					} else {
						removeFile(curPath);
					}
				});
				fs.rmdir(dir,function(err){
					if(err!==null && verbose_log){
						console.error("can't delete this temp folder: "+dir+ " / error: "+err);
						return "erreur";
					}
				});
			}
		});
	};
	var escapeHtml = function(texte) {
		return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	};
	var formats={
			"pdf":{command:'office', extension:"pdf", filter:'', metas:'<meta name="changedby" content="" />\n'},	//:writer_web_pdf_Export (no filter required) / special meta 'changedby' required to avoid blank page.
			"odt":{command:'office', extension:"odt", filter:':writer8', metas:''},
			//"doc":{command:'abiword', extension:"doc", filter:'', metas:''},	//bug
			"doc":{command:'office', extension:"doc", filter:'', metas:''},	//good	//"MS Word 95"
			//"docx":{command:'abiword', extension:"docx", filter:'', metas:''},	//no image
			"docx":{command:'office', extension:"docx", filter:"MS Word 2007 XML", metas:''},	//:writer_OOXML=bad	//Office Open XML Text=no image //MS Word 2007 XML=no image	//:MS Word 97	//no image
	};
	/**
	 * Source : http://ask.libreoffice.org/en/question/20111/converting-files-using-soffice-convert-to-with-embedded-images-html-to-doc/
	 */
	return {
		getPadDocument : function(padId, revNum, format, callback) {	//callback(err, file)
			//current datetime
			var today = new Date();
			var mil = today.getMilliseconds().toString();
			var sec = (today.getSeconds()>9 ? today.getSeconds().toString() : 0+today.getSeconds().toString());
			var min = (today.getMinutes()>9 ? today.getMinutes().toString() : 0+today.getMinutes().toString());
			var h = (today.getHours()>9 ? today.getHours().toString() : 0+today.getHours().toString());
			var d = (today.getDate()>9 ? today.getDate().toString() : 0+today.getDate().toString());
			var m = ( today.getMonth()+1>9 ? (today.getMonth()+1).toString() : 0+(today.getMonth()+1).toString() ); // January is 0!
			var y = today.getFullYear().toString();
			today=null;
			var fulldate = y+"_"+m+"_"+d+"_"+h+"_"+min+"_"+sec+"_"+mil;
			//var randNum = Math.floor(Math.random()*0xFFFFFFFF);	//random number to avoids duplicate files during multi convertions.
			//some local settings :
			var srcFile = tempDirectory + "/" +padId+ "_" +fulldate+ ".html";
			var destFile = tempDirectory + "/" +padId+ "_" +fulldate+ "."+format;
			var author = settings.title;
			var title = "";
			var keywords ="";
			//retrieve settings from settings.json:
			if (settings.ep_export_documents_images) {
				author = settings.ep_export_documents_images.author;
				if (author && author==="auto"){
					author = settings.title;
				}
				author = escapeHtml(author);
				title = settings.ep_export_documents_images.title;
				if (title && padId && title.indexOf("%s") !== -1){
					title = title.replace("%s", padId);
				}
				title = escapeHtml(title);
				if (settings.ep_export_documents_images.keywords!==undefined){
					keywords = settings.ep_export_documents_images.keywords;
				}
				if ( (settings.ep_export_documents_images.remove_LOdir!==undefined) && (settings.ep_export_documents_images.remove_LOdir===true || settings.ep_export_documents_images.remove_LOdir===false)){
					remove_LOdir = settings.ep_export_documents_images.remove_LOdir;
				}
			}
			if ( (settings.loglevel==='INFO' || settings.loglevel==='DEBUG') && verbose_log) {
				console.info("--------");
				console.info("Preparing Office conversion...");
				console.info("Operating System:"+os.type());
				console.info("Path to Office:"+officePath);
				console.info("Remove Office directory ("+LO_tmp_dir+"):"+remove_LOdir);
				console.info("Author: "+author);
				console.info("Title: "+title);
				console.info("Keywords: "+keywords);
				console.info("Target file: "+destFile);
			}
			var html=null;
			padManager.getPad(padId, null, function(err, pad){
				if (err!==null) {
					console.error('Error to get pad : '+err);
					return callback(err, null);
				} else {
					exporthtml.getPadHTMLDocument(padId, pad.head, false, function(err, _html) {	//get pad in html
						if (err) {
							console.error("We can't retrieve the pad in html :-( ("+err+")");
							return callback(err, null);
						} else {
							//HTML metas
							html = _html.replace('<head>', '<head>\n'+
								'<meta name="generator" content="'+officePath+'" />\n'+
								'<meta name="author" content="'+author+'" />\n'+
								'<meta name="description" content="'+title+'" />\n'+
								formats[format].metas+
								'<meta name="keywords" content="'+keywords+'" />\n');
							//HTML title
							html = html.replace(/(<title[^>]*>)([\s\S]*?)(<\/title>)/g,	//replace title
								function (_, startTag, body, endTag) {
									return startTag + title + endTag;
							});
							/*html = html.replace(/(<\/style>)/gi,
		        			function(match, startTag, body, endTag){
			              		//match	: The matched substring
			                        //startTag : The nth parenthesized submatch string
			                  	//body	: The offset of the matched substring within the total string being examined
			                  	//endTag:  total string being examined.
		              			return ' .ep_export_documents_images_img {max-width:100%;border-style:none;width:auto;height:auto;} '+match ;
							});*/
							fs.writeFile(srcFile, html, function(err) {
								if (err) {
									console.error('Problem to create temporary html file : '+srcFile);
									callback('Problem to create temporary html file : '+srcFile, null);
								} else {
									//source : http://ask.libreoffice.org/en/question/2641/convert-to-command-line-parameter/
									//source : http://ask.libreoffice.org/en/question/1686/how-to-not-connect-to-a-running-instance/
									//Unix-like version :
									if ( (settings.loglevel==='INFO' || settings.loglevel==='DEBUG') && verbose_log){
										console.info("Starting Office conversion. extension: "+formats[format].extension+ " / filter: "+formats[format].filter);
									}
									/* Office processing */
									if (formats[format].command==='office') {
										try{
											var LOcommand = child_process.spawn(officePath, ['-env:UserInstallation=file://'+LO_tmp_dir,'--nodefault','--norestore','--headless','--invisible','--convert-to',formats[format].extension+formats[format].filter,'--outdir',tempDirectory,srcFile] );
											LOcommand.stdout.on('data', function (data) {		//process stdout
												if (settings.loglevel==='INFO' && verbose_log){
													console.info('Office stdout: ' + data);
												}
											});
											LOcommand.stderr.on('data', function (data) {		//process crashed
												if(verbose_log){
													console.error('Office stderr: ' + data);
												}
												removeFile(srcFile);
												if (remove_LOdir){
													removeDir(LO_tmp_dir);
												}
												callback(data, null);
											});
											LOcommand.on('close', function (code) {	//end of process
												if((settings.loglevel==='INFO' || settings.loglevel==='DEBUG') && verbose_log){
													console.debug('Export: child process exited with code ' + code);
												}
												removeFile(srcFile);
												if (remove_LOdir){
													removeDir(LO_tmp_dir);
												}
												return callback(null, destFile);
											});
										}catch(e){
											console.error(e);
										}
										/* Abiword */
										/*} else if (formats[format].command=='abiword') {
		            	  abiword = child_process.spawn(settings.abiword, ["--to="+format, srcFile]);
		            	  abiword.on('exit', function (code) {
		            		  console.log("Abiword died with exit code " + code);
		            		  if (code==0) {
		            			  callback(null, destFile);
		            			  removeFile(srcFile);
		            		  }
		      	          });*/
									} else {
										return callback("No command specified ! Bye !", null);
									}
								}
							});
						}
					});
				}
			});
		}
	};
})();
exports.getPadDocument = ep_export_documents_images.getPadDocument;