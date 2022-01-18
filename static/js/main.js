$(document).ready(function (){
	//var pad_root_path = new RegExp(/.*\/p\/[^\/]+/).exec(document.location.pathname);
	//var pad_root_url = document.location.href.replace(document.location.pathname, pad_root_path);
	$("#documentimagespdfa").attr("href", document.location.href+"/export/document-images/pdf");
	$("#documentimagesodta").attr("href", document.location.href+"/export/document-images/odt");
	$("#documentimagesdocxa").attr("href", document.location.href+"/export/document-images/docx");
	$("#documentimagesdoca").attr("href", document.location.href+"/export/document-images/doc");

});