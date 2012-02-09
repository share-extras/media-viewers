/**
 * Copyright (C) 2010-2011 Share Extras Contributors.
 *
 */

/**
 * This is the "PDF" plug-in used to display documents directly in the web browser.
 *
 * Supports the "application/pdf" mime types.
 *
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.PDF
 */
(function()
{
    /**
     * PDF plug-in constructor
     *
     * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
     * @param attributes {Object} Arbitrary attributes brought in from the <plugin> element
     */
    Alfresco.WebPreview.prototype.Plugins.PDF = function(wp, attributes)
    {
       this.wp = wp;
       this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
       return this;
    };
    
    Alfresco.WebPreview.prototype.Plugins.PDF.prototype =
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
           * @default "2000000"
           */
          srcMaxSize: "2000000"
       },
    
       /**
        * Tests if the plugin can be used in the users browser.
        *
        * @method report
        * @return {String} Returns nothing if the plugin may be used, otherwise returns a message containing the reason
        *         it cant be used as a string.
        * @public
        */
       report: function PDF_report()
       {
          // TODO: Detect whether Adobe PDF plugin is installed, or if navigator is Chrome
          // See http://stackoverflow.com/questions/185952/how-do-i-detect-the-adobe-acrobat-version-installed-in-firefox-via-javascript
       },
    
       /**
        * Display the node.
        *
        * @method display
        * @public
        */
       display: function PDF_display()
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
             var src = this.wp.getContentUrl();
             return '<iframe src="' + src + '" name="' + this.wp.options.name + '"></iframe>';
          }
       }
    };

})();
