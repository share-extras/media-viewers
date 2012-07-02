/**
 * Copyright (C) 2010-2012 Share Extras Contributors.
 *
 */

/**
 * This is the "WebODF" plugin used to display documents using the WebODF HTML 5 project.
 *
 * Supports at least the following mime types: "application/vnd.oasis.opendocument.text".
 *
 * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
 * @param attributes {Object} Arbitrary attributes brought in from the <plugin> element
 */
Alfresco.WebPreview.prototype.Plugins.WebODF = function(wp, attributes)
{
   this.wp = wp;
   this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
   return this;
};

Alfresco.WebPreview.prototype.Plugins.WebODF.prototype =
{
   /**
    * Attributes
    */
   attributes:
   {
      /**
       * Decides if the node's content or one of its thumbnails shall be displayed.
       * Leave it as it is if the node's content shall be used.
       * Set to a custom thumbnail definition name if the node's thumbnail contains the image to display.
       *
       * @property src
       * @type String
       * @default null
       */
      src: null,

      /**
       * Maximum size to display given in bytes if the node's content is used.
       * If the node content is larger than this value the image won't be displayed.
       * Note! This doesn't apply if src is set to a thumbnail.
       *
       * @property srcMaxSize
       * @type String
       * @default "500000"
       */
      srcMaxSize: "500000"
   },

   /**
    * Tests if the plugin can be used in the users browser.
    *
    * @method report
    * @return {String} Returns nothing if the plugin may be used, otherwise returns a message containing the reason
    *         it cant be used as a string.
    * @public
    */
   report: function WebODF_report()
   {
      // Report nothing since all browsers support the <img> element  ....well maybe not ascii browsers :-)
   },

   /**
    * Display the node.
    *
    * @method display
    * @public
    */
   display: function WebODF_display()
   {
      var srcMaxSize = this.attributes.srcMaxSize;
      if (!this.attributes.src && srcMaxSize.match(/^\d+$/) && this.wp.options.size > parseInt(srcMaxSize))
      {
         // The node's content was about to be used and its to big to display
         var msg = '';
         msg += this.wp.msg("Image.tooLargeFile", this.wp.options.name, Alfresco.util.formatFileSize(this.wp.options.size));
         msg += '<br/>';
         msg += '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">';
         msg += this.wp.msg("Image.downloadLargeFile");
         msg += '</a>';
         msg += '<br/>';
         msg += '<a style="cursor: pointer;" class="theme-color-1" onclick="javascript: this.parentNode.parentNode.innerHTML = \'<img src=' + this.wp.getContentUrl(false) + '>\';">';
         msg += this.wp.msg("Image.viewLargeFile");
         msg += '</a>';
         return '<div class="message">' + msg + '</div>';
      }
      else
      {
         //var src = this.attributes.src ? this.wp.getThumbnailUrl(this.attributes.src) : this.wp.getContentUrl();
         //return '<img src="' + src + '" alt="' + this.wp.options.name + '" title="' + this.wp.options.name + '"/>';
         
         var me = this;

         var cEl = document.createElement("div");
         Dom.addClass(cEl, "odf-preview-container");
         var pEl = document.createElement("div");
         Dom.setAttribute(pEl, "id", this.wp.getPreviewerElement().id + "-odf-preview");
         Dom.addClass(pEl, "odf-preview-content");
         cEl.appendChild(pEl);
         this.wp.getPreviewerElement().appendChild(cEl);
         
         // Library paths fix
         runtime.libraryPaths = function () {
             return [Alfresco.constants.URL_CONTEXT + "res/extras/modules/webodf/lib"];
         };
         
         // File size detection method fix (API does not allow HEAD against content items)
         runtime.getFileSize = function (path, callback) {
            callback(parseInt(me.wp.options.size, 10));
         }
         
         // Load the ODF canvas
         runtime.loadClass("odf.OdfCanvas");

         // Setup web preview
         var odfcanvas = new odf.OdfCanvas(pEl);
         var contentUrl = this.wp.getContentUrl();
         odfcanvas.load(contentUrl);
         
         var msgEl = Dom.getElementsByClassName("message", "div", this.wp.getPreviewerElement(), function(el) {
            Dom.setStyle(el, "display", "none");
         });
         
         // TODO Implement zooming, see http://stackoverflow.com/questions/2026294/zoom-css-javascript
         // TODO Implement maximised mode
      }
   }
};



/**
 * WebODFPreview preview component. 
 *
 * @namespace Alfresco
 * @class Alfresco.WebODFPreviewPreview
 */
(function()
{
})();
