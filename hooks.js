var path = require("path");
var fs = require("fs");
var eejs = require("ep_etherpad-lite/node/eejs");
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var settings = require("ep_etherpad-lite/node/utils/Settings");
var domline = require("ep_etherpad-lite/static/js/domline").domline;
var linestylefilter = require("ep_etherpad-lite/static/js/linestylefilter").linestylefilter;
var exportLibreOffice = require("./js/exportLibreOffice");
//settings
var verbose_log = false;
if (settings.ep_export_documents_images!==undefined) {
    if (settings.ep_export_documents_images.verbose_log===true || settings.ep_export_documents_images.verbose_log===false){
    	verbose_log = settings.ep_export_documents_images.verbose_log;
    }
}
exports.expressCreateServer = function(hook_name, args, cb) {
    args.app.get('/p/:pad/:rev?/export/document-images/:format', function(req, res, next) {
		var padId = req.params.pad;
		var revision = req.params.rev ? req.params.rev : null;
		var format = req.params.format;
		var removeFile = function(file) {
		    if (fs.existsSync(file)) {
				if (settings.loglevel==='INFO' && verbose_log){
				    console.info("We delete this file : " + file);
				}
				fs.unlinkSync(file);
		    }
		};
		exportLibreOffice.getPadDocument(padId, revision, format, function(err, file) {
		    if (err !== null) {
				console.error('Error during getPadDocument() : ' + err);
				res.contentType('plain/text');
				res.send('Fatal error : ' + err);
		    } else {
				if (fs.existsSync(file)) {
				    //current date
				    var today = new Date();
				    var d = (today.getDate()>9 ? today.getDate().toString() : 0+today.getDate().toString());
				    var m = ( today.getMonth()+1>9 ? (today.getMonth()+1).toString() : 0+(today.getMonth()+1).toString() ); // January is 0!
				    var y = today.getFullYear().toString();
				    var fulldate = y+"_"+m+"_"+d;
				    var filename = padId+"_"+fulldate+"."+format;
				    res.download(file, filename, function(err) {
						if (err) {
						    console.error("Problem during file sending !");
						    console.info(" ");
						} else {
						    console.log("File sent. OK.");
						    console.info(" ");
						}
						removeFile(file);
				    });
				} else {
				    res.contentType('plain/text');
				    res.send("File doesn't exist anymore !");
				}
		    }
		});

    });
};
exports.eejsBlock_exportColumn = function(hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_export_documents_images/templates/exportcolumn.html", {}, module);
    return cb();
};
exports.eejsBlock_scripts = function(hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_export_documents_images/templates/scripts.html", {}, module);
    return cb();
};
exports.eejsBlock_styles = function(hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_export_documents_images/templates/styles.html", {}, module);
    return cb();
};
/** context: apool, attribLine, text
 * Source: http://etherpad.org/doc/v1.3.0/#index_getlinehtmlforexport
 */
exports.getLineHTMLForExport = function(hook, context) {
    //test from https://github.com/wtsi-hgi/ep_html_export_using_client_filters/blob/master/ep_html_export_using_client_filters.js
	/**
	 * Replace Hex coded special by original special chars.
	 */
	var unescape_chars = function(text) {
	    //source : http://webdesign.about.com/od/localization/l/blhtmlcodes-ascii.htm
	    var HTML_ENTITY_MAP = {
		    '&amp;':	'&'	,
		    '&lt;':	'<'	,
		    '&gt;':	'>'	,
		    '&quot;':	'"'	,
		    '&#x20;':	' '	,
		    '&#x27;':	"'"	,
		    '&#x2d;':	"-"	,
		    '&#x2E;':	'.'	,
		    '&#x2F;':	'/'	,
		    '&#x3a;':	':'
	    };
	    for (var element in HTML_ENTITY_MAP) {
	    	if(HTML_ENTITY_MAP.hasOwnProperty(element)){
				var regex = new RegExp(element,'gi');
				while (text.match(regex)!==null) {
				    text = text.replace(regex, HTML_ENTITY_MAP[element]);
				}
	    	}
	    }
	    return text;
	};
    var emptyLine = (context.text === '\n');
    var domInfo = domline.createDomLine(!emptyLine, true);
    linestylefilter.populateDomLine(context.text, context.attribLine, context.apool, domInfo);
    domInfo.prepareForAdd();
    var lineContent = domInfo.node.innerHTML;
    lineContent = unescape_chars(lineContent);	//we replace special chars dropped by Security module
    //console.log(lineContent);	//DEBUG
    /**
	 * TODO
	 * 1/ detect URL
	 * 	2a/ detect Img
	 * 	2b/ detect Youtube
	 * 	2c/ detect Vimeo
	 * 	2d/ detect Dailymotion
	 * 	...
	 * */
    var isURL = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    //source: http://stackoverflow.com/questions/17911017/how-to-replace-image-urlplain-text-with-regex
    //var isImgUrl = /https?:\/\/.*\.(?:png|jpg|gif)/gi;	//original OK
    //var isImgUrl = new RegExp("https?:\/\/.*\.(?:png|jpg|jpeg|gif)", "gi");//good
    var isImgUrl = new RegExp("https?:\/\/.*?\.(?:png|jpg|jpeg|gif)", "gi");//good mais gourmand
    var regLink = new RegExp("/<a[^>]*>(.*?)<\/a>/","gi");	//get full link tag	//ok
    var regYt = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;	//0
    var regYt2 = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([\w\-]{10,12})\b[?=&\w]*(?!['"][^<>]*>|<\/a>)/ig;
    var regYt3 = /(\?v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/ig;	//YT+(bad)id
    var regYtID = /[a-zA-Z0-9\-\_]{11}/gi; //Yt id check - ok
    //var regYt4 = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)/ig;
    var compte=0;
    lineContent = lineContent.replace(isImgUrl, function(match, p1, offset, string) {
		//source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2Freplace#Specifying_a_function_as_a_parameter
		//match	: The matched substring
		//p1	: The nth parenthesized submatch string
		//offset: The offset of the matched substring within the total string being examined
		//string:  total string being examined.
		compte++;
		if (compte%2===0){
		    return '<img src="'+match+'" class="ep_export_documents_images_img" style="border-style:none;width:auto;height:auto;max-width:100%;" alt="" >';
		}
		return match;
    });//very good!!
    /*if (lineContent.match(regLink)!==null) {
	console.warn("LLLLL regLink : "+lineContent.match(regLink).length);
    }
    if (lineContent.match(isImgUrl)!==null) {
	console.warn("XXXXXXXX isImgUrl : "+lineContent.match(isImgUrl).length);
    }*/
    if (lineContent.match(regYt3)!==null) {
    	console.warn("regexp Youtube3 : "+lineContent);
    }
    /*if (lineContent.match(regYt4)!==null) {
	console.warn("regexp Youtube4 : "+lineContent);
    }*/
    compte=0;
    lineContent = lineContent.replace(regYt3, function(match, p1, offset, string) {
		//source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2Freplace#Specifying_a_function_as_a_parameter
		//match	: The matched substring
		//p1	: The nth parenthesized submatch string
		//offset: The offset of the matched substring within the total string being examined
		//string:  total string being examined.
		compte++;
		var id="";
		if (compte%2===0) {
		    match = match.replace(regYtID, function(mitch, p1, offset, string) {
				//console.warn("Avant tri:"+mitch);
				id=mitch;
				console.warn("ID="+id);
				return mitch;
		    });
		    return '<img src="http://img.youtube.com/vi/'+id+'/1.jpg" class="ep_export_documents_images_img" style="border-style:none;width:auto;height:auto;max-width:100%;" alt="" >';
		}
		return match;
    });
    /*lineContent = lineContent.replace(regYt3, function(match, p1, offset, string) {
	//source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2Freplace#Specifying_a_function_as_a_parameter
	//match	: The matched substring
	//p1	: The nth parenthesized submatch string
	//offset: The offset of the matched substring within the total string being examined
	//string:  total string being examined.
	var match2 = match.replace(regYtID, function(mitch, p1, offset, string) {
	    console.warn("Avant tri:"+mitch);
	    return mitch;
	});
	console.warn("A trier : "+match2);
	//return match2;
	return 'toto';
    });*/
	//console.log('## '+lineContent);	//DEBUG
    // TODO thumbnails for embedded videos
    /*if (context.text.indexOf("<iframe") != -1 ) {
        var isEmbedMedia = "/(<iframe.*?>.*?<\/iframe>)/g"; //<iframe width="420" height="315" src="https://www.youtube.com/embed/VFC20GQk36U" frameborder="0" allowfullscreen=""></iframe>
        var iframeURL = lineContentreplace(isImgUrl, function(match, p1, offset, string) {
    	//source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FString%2Freplace#Specifying_a_function_as_a_parameter
    	//match	: The matched substring
    	//p1	: The nth parenthesized submatch string
    	//offset: The offset of the matched substring within the total string being examined
    	//string:  total string being examined.
            console.warn(match);
            return '';
    	    return '<img src="'+match+'" class="ep_export_documents_images_img" style="border-style:none;width:auto;height:auto;max-width:100%;" alt="" >';
        });
    }*/
    return lineContent+ '<br />';
};
/**
 * ???
 */
function _analyzeLine(alineAttrs, apool) {
    var author = null;
    if (alineAttrs) {
		var opIter = Changeset.opIterator(alineAttrs);
		if (opIter.hasNext()) {
		    var op = opIter.next();
		    author = Changeset.opAttributeValue(op, 'author', apool);
		}
    }
    return author;
}
exports.aceGetFilterStack = function(name, context){
    return [
      context.linestylefilter.getRegexpFilter(
        new RegExp("http.+((\.[pP][nN][gG])|(\.[jJ][pP][gG])|(\.[gG][iI][fF])|(\.[jJ][pP][eE][gG])|(\.[bB][mM][pP]))", "g"), 'image')
    ];
};
exports.aceCreateDomLine = function(name, args){
    if (args.cls.indexOf('image') > -1) { // if it's an image
      var src;
      var cls = args.cls.replace(/(^| )image:(\S+)/g, function(x0, space, image) {
        src = image;
        return space + "image image_" + image;
      });
     return [{
       cls: cls,
       extraOpenTags: '<img src="' + src + '" style="max-width:100%" /><br/>',
       extraCloseTags:''
     }];
    }
};