/*
 * Copyright (C) 2010-2012 Share Extras contributors
 *
 * This file is part of the Share Extras project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const K_UNKNOWN_SCALE = 0;
const K_CSS_UNITS = 96.0 / 72.0;
const K_MIN_SCALE = 0.25;
const K_MAX_SCALE = 4.0;

/**
 * YUI aliases
 */
var Dom = YAHOO.util.Dom, 
    Event = YAHOO.util.Event, 
    Element = YAHOO.util.Element;
    
/**
 * This is the "PdfJs" plugin that renders pdf file using third party pdf.js
 * library, or as fallback any pdf viewer plugin installed in the browser
 * 
 * Supports the following mime types: "application/pdf".
 * 
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.PdfJs
 * @author Peter Lšfgren Loftux AB
 */
Alfresco.WebPreview.prototype.Plugins.PdfJs = function(wp, attributes)
{
   this.wp = wp;
   this.id = wp.id; // needed by Alfresco.util.createYUIButton
   this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
   return this;
};

Alfresco.WebPreview.prototype.Plugins.PdfJs.prototype = {
   /**
    * Attributes
    */
   attributes : {

      /**
       * Decides if the node's content or one of its thumbnails shall be
       * displayed. Leave it as it is if the node's content shall be used. Set
       * to a custom thumbnail definition name if the node's thumbnail contains
       * the PdfJs to display.
       * 
       * @property src
       * @type String
       * @default null
       */
      src : null,

      /**
       * Skipbrowser test, mostly for developer to force test loading Valid
       * options "true" "false" as String
       * 
       * @property skipbrowsertest
       * @type String
       * @default "false"
       */
      skipbrowsertest : "false",

      /**
       * Display mode, either "iframe" or "block"
       * 
       * @property mode
       * @type String
       * @default "iframe"
       */
      mode: "iframe",

      /**
       * Default zoom level
       * 
       * @property defaultScale
       * @type String
       * @default "auto"
       */
      defaultScale: "two-page-fit",
      
      /**
       * Multipler for zooming in/out
       * 
       * @property scaleDelta
       * @type String
       * @default "1.1"
       */
      scaleDelta: "1.1",

      /**
       * Layout to use to display pages, "single" or "multi"
       * 
       * @property pageLayout
       * @type String
       * @default "multi"
       */
      pageLayout: "multi"
   },
   
   pdfDoc: null,
   
   pageNum: 1,

   pages: [],
   
   numPages: 0,
   
   thumbnails: [],
   
   currentScale: K_UNKNOWN_SCALE,
   
   currentScaleValue: null,
   
   widgets: {},
   
   maximized: false,

   /**
    * Tests if the plugin can be used in the users browser.
    * 
    * @method report
    * @return {String} Returns nothing if the plugin may be used, otherwise
    *         returns a message containing the reason it cant be used as a
    *         string.
    * @public
    */
   report : function PdfJs_report()
   {
      var canvassupport = false, skipbrowsertest = (this.attributes.skipbrowsertest && this.attributes.skipbrowsertest === "true") ? true : false;

      if (skipbrowsertest === false)
      {
         // Test if canvas is supported
         if (window.HTMLCanvasElement)
         {
            canvassupport = true;
            // Do some engine test as well, some support canvas but not the
            // rest for full html5
            if (YAHOO.env.ua.webkit > 0 && YAHOO.env.ua.webkit < 534)
            {
               // http://en.wikipedia.org/wiki/Google_Chrome
               // Guessing for the same for safari
               canvassupport = false;
            }
            if (YAHOO.env.ua.ie > 0 && YAHOO.env.ua.ie < 9)
            {
               canvassupport = false;
            }
            if (YAHOO.env.ua.gecko > 0 && YAHOO.env.ua.gecko < 5)
            {
               // http://en.wikipedia.org/wiki/Gecko_(layout_engine)
               canvassupport = false;
            }
         }

      } else
      {
         canvassupport = true;
      }

      // If neither is supported, then report this, and bail out as viewer
      if (canvassupport === false && skipbrowsertest === false)
      {
         return this.wp.msg("label.browserReport", "&lt;canvas&gt; missing");
      }
   },

   /**
    * Display the node.
    * 
    * @method display
    * @public
    */
   display : function PdfJs_display()
   {
      // html5 is supported, display with pdf.js
      // id and name needs to be equal, easier if you need scripting access
      // to iframe
      if (this.attributes.mode == "iframe")
      {
         var fileurl;
         if (this.attributes.src)
         {
            // We do not use the built in function to get url, since pdf.js will
            // strip
            // attributes from the url. Instead we add it back in pdfviewer.js
            fileurl = Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnails/pdf/" + this.wp.options.name
                  + '.pdf';
         }
         else
         {
            fileurl = this.wp.getContentUrl();
         }
         var previewHeight = this.wp.setupPreviewSize();
         Dom.setAttribute(this.wp.getPreviewerElement(), "height", (previewHeight - 10).toString());
         var displaysource = '<iframe id="PdfJs" name="PdfJs" src="' + Alfresco.constants.URL_SERVICECONTEXT + 'extras/components/preview/pdfviewer?htmlid=' + encodeURIComponent(this.wp.id) + '&file=' + encodeURIComponent(fileurl)
         + '" scrolling="yes" marginwidth="0" marginheight="0" frameborder="0" vspace="5" hspace="5"  style="height:' + (previewHeight - 10).toString()
         + 'px;"></iframe>';
         
         // Return HTML that will be set as the innerHTML of the previewer
         return displaysource;
      }
      else
      {
         // Viewer HTML is contained in an external web script, which we load via XHR, then onViewerLoad() does the rest
         Alfresco.util.Ajax.request({
            url: Alfresco.constants.URL_SERVICECONTEXT + 'extras/components/preview/pdfjs?htmlid=' + encodeURIComponent(this.wp.id),
            successCallback: {
               fn: this.onViewerLoaded,
               scope: this
            },
            failureMessage: 'Could not load the viewer component'
         });
         
         // Window resize behaviour
         Event.addListener(window, "resize", this.onRecalculatePreviewLayout, this, true);
         
         // Return null means WebPreview instance will not overwrite the innerHTML of the preview area
         return null;
      }
   },
   
   /**
    * Handler for successful load of the viewer markup webscript
    * 
    * @method onViewerLoaded
    * @public
    */
   onViewerLoaded: function PdfJs_onViewerLoaded(p_obj)
   {
      this.wp.getPreviewerElement().innerHTML = p_obj.serverResponse.responseText;
      
      // Cache references to commonly-used elements
      this.controls = Dom.get(this.wp.id + "-controls");
      this.pageNumber = Dom.get(this.wp.id + "-pageNumber");
      this.viewer = Dom.get(this.wp.id + "-viewer");
      Event.addListener(this.viewer, "scroll", this.onViewerScroll, this, true);
      
      // Set up viewer
      if (this.attributes.pageLayout == "multi")
      {
         Dom.addClass(this.viewer, "multiPage");
      }
      
      // Set up toolbar
      this.widgets.nextButton = Alfresco.util.createYUIButton(this, "next", this.onPageNext);
      this.widgets.previousButton = Alfresco.util.createYUIButton(this, "previous", this.onPagePrevious);
      Event.addListener(this.wp.id + "-pageNumber", "change", this.onPageChange, this, true);
      this.widgets.zoomOutButton = Alfresco.util.createYUIButton(this, "zoomOut", this.onZoomOut);
      this.widgets.zoomInButton = Alfresco.util.createYUIButton(this, "zoomIn", this.onZoomIn);
      Event.addListener(this.wp.id + "-scaleSelect", "change", this.onZoomChange, this, true);
      this.widgets.downloadButton = Alfresco.util.createYUIButton(this, "download", this.onDownloadClick);
      this.widgets.maximize = Alfresco.util.createYUIButton(this, "fullpage", this.onMaximizeClick);
      
      // Set height of the container and the viewer area
      this._setPreviewerElementHeight();
      this._setViewerHeight();
      
      this._loadPdf();
   },
   
   /**
    * Set the height of the preview element
    * 
    * @method _setPreviewerElementHeight
    * @private
    */
   _setPreviewerElementHeight: function _setPreviewerElementHeight()
   {
      if (!this.maximized)
      {
         var previewHeight = this.wp.setupPreviewSize();
         Dom.setStyle(this.wp.getPreviewerElement(), "height", (previewHeight - 10).toString() + "px");
      }
      else
      {
         Dom.setStyle(this.wp.getPreviewerElement(), "height", (Dom.getViewportHeight()).toString() + "px");
      }
   },
   
   /**
    * Set the height of the viewer area where content is displayed, so that it occupies the height of the parent previewer element
    * minus the menu bar.
    * 
    * @method _setViewerHeight
    * @private
    */
   _setViewerHeight: function _setViewerHeight()
   {
      var previewRegion = Dom.getRegion(this.viewer.parentNode);
      var controlRegion = Dom.getRegion(this.controls);
      Dom.setStyle(this.viewer, "height", (previewRegion.height - controlRegion.height).toString() + "px");
      this.viewerRegion = Dom.getRegion(this.viewer);
   },
   
   /**
    * Fetch the PDF content and display it
    * 
    * @method _fetchPdf
    * @private
    */
   _loadPdf: function PdfJs__loadPdf() {
      var fileurl, me = this;
      if (this.attributes.src)
      {
         // We do not use the built in function to get url, since pdf.js will
         // strip
         // attributes from the url. Instead we add it back in pdfviewer.js
         fileurl = Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnails/pdf/" + this.wp.options.name
               + '.pdf';
      }
      else
      {
         fileurl = this.wp.getContentUrl();
      }
      
      PDFJS.getPdf({
         url: fileurl,
         progress: function getPdfProgress(evt) {
            if (evt.lengthComputable)
            {
               //me.progress(evt.loaded / evt.total);
            }
         },
         error: function getPdfError(e) {
            var loadingIndicator = document.getElementById('loading');
            loadingIndicator.textContent = 'Error';
            var moreInfo = {
              message: 'Unexpected server response of ' + e.target.status + '.'
            };
            //me.error('An error occurred while loading the PDF.', moreInfo);
         }
      }, function getPdfHelloWorld(data) {
          me.pdfDoc = new PDFJS.PDFDoc(data);
          me.numPages = me.pdfDoc.numPages;
          me._renderPdf.call(me);
      });
   },
   
   /**
    * Display the PDF content in the container
    * 
    * @method _renderPdf
    * @private
    */
   _renderPdf: function PdfJs__renderPdf()
   {
      this.loading = true;
      for (var i = 0; i < this.pdfDoc.numPages; i++)
      {
         this._renderPageContainer(i + 1);
      }
      this.loading = false;
      
      // Set scale, if not already set
      if (this.currentScale === K_UNKNOWN_SCALE)
      {
         // Scale was not initialized: invalid bookmark or scale was not specified.
         // Setting the default one.
         this._setScale(this._parseScale(this.attributes.defaultScale));
         this.currentScaleValue = this.attributes.defaultScale;
      }
      this._scrollToPage(this.pageNum);
      
      // Update toolbar
      this._updateZoomControls();
      Dom.get(this.wp.id + "-numPages").textContent = this.numPages;
      
   },
   
   /**
    * Calculate page zoom level based on the supplied value. Recognises numerical values and special string constants, e.g. 'page-fit'.
    * Normally used in conjunction with setScale(), since this method does not set the current value.
    * 
    * @method _parseScale
    * @private
    * @return {float} Numerical scale value
    */
   _parseScale: function PdfJs__parseScale(value)
   {
       var scale = parseFloat(value);
       if (scale)
       {
          return scale;
       }

       var currentPage = this.pages[this.pageNum - 1],
          container = currentPage.container,
          hmargin = parseInt(Dom.getStyle(container, "margin-left")) + parseInt(Dom.getStyle(container, "margin-right")),
          vmargin = parseInt(Dom.getStyle(container, "margin-top")) + parseInt(Dom.getStyle(container, "margin-bottom")),
          contentWidth = parseInt(currentPage.content.width),
          contentHeight = parseInt(currentPage.content.height),
          clientWidth = this.viewer.clientWidth - 1, // allow an extra pixel in width otherwise 2-up view wraps
          clientHeight = this.viewer.clientHeight;
       
       if ('page-width' == value)
       {
          var pageWidthScale = (clientWidth - hmargin) / contentWidth;
          return pageWidthScale;
       }
       else if ('two-page-width' == value)
       {
          var pageWidthScale = (clientWidth - hmargin*2) / contentWidth;
          return pageWidthScale / 2;
       }
       else if ('page-height' == value)
       {
          var pageHeightScale = (clientHeight - vmargin) / contentHeight;
          return pageHeightScale;
       }
       else if ('page-fit' == value)
       {
          var pageWidthScale = (clientWidth - hmargin) / contentWidth,
             pageHeightScale = (clientHeight - vmargin) / contentHeight;
          return Math.min(pageWidthScale, pageHeightScale);
       }
       else if ('two-page-fit' == value)
       {
          var pageWidthScale = (clientWidth - hmargin*2) / contentWidth,
             pageHeightScale = (clientHeight - vmargin) / contentHeight;
          return Math.min(pageWidthScale / 2, pageHeightScale);
       }
       else if ('auto' == value)
       {
          var pageWidthScale = (clientWidth - hmargin) / contentWidth;
          return Math.min(1.0, pageWidthScale);
       }
       else
       {
          throw "Unrecognised zoom level '" + value + "'";
       }
   },
   
   /**
    * 
    */
   _setScale: function PdfJs__setScale(value)
   {
      if (value == this.currentScale)
      {
         return;
      }
      this.currentScale = value;
      
      // Remove all the existing canvas elements
      for (var i = 0; i < this.pages.length; i++)
      {
         var page = this.pages[i];
         this._resetPage(page);
      }

      // Now redefine the row margins
      this._alignViewerRows();
   },
   
   /**
    * 
    */
   _alignViewerRows: function PdfJs__alignViewerRows()
   {
      var rowPos = -1, rowWidth = 0, largestRow = 0;
      if (this.attributes.pageLayout == "multi")
      {
         Dom.setStyle(this.viewer, "padding-left", "0px");
         for (var i = 0; i < this.pages.length; i++)
         {
            var page = this.pages[i], container = page.container, vpos = this._getPageVPos(page);
            // If multi-page mode is on, we need to add custom extra margin to the LHS of the 1st item in the row to make it centred
            if (vpos != rowPos)
            {
               rowWidth = 0;
            }
            rowWidth += Dom.getRegion(container).width + parseInt(Dom.getStyle(container, "margin-left")) * 2;
            largestRow = Math.max(largestRow, rowWidth);
            rowPos = vpos;
         }
         Dom.setStyle(this.viewer, "padding-left", "" + Math.floor(((this.viewer.clientWidth - largestRow) / 2)) + "px");
      }
   },
   
   /**
    * 
    */
   _renderVisiblePages: function PdfJs__renderVisiblePages()
   {
      var marginTop = parseInt(Dom.getStyle(this.pages[this.pageNum - 1].container, "margin-top")),
         scrollTop = this.viewer.scrollTop;
      
      // Render visible pages
      for (var i = 0; i < this.pages.length; i++)
      {
         var page = this.pages[i];
         if (!page.canvas && this._getPageVPos(page) < this.viewerRegion.height * 1.5)
         {
            this._renderPage(page);
         }
      }
   },
   
   /*
    * PAGE METHODS
    */
   
   /**
    * Render a specific page in the container
    * 
    * @method _renderPageContainer
    * @private
    */
   _renderPageContainer: function PdfJs__renderPageContainer(pageNum)
   {
      // TODO separate creating the divs from the rendering
      var content = this.pdfDoc.getPage(pageNum)
      
       var div = document.createElement('div');
       div.id = this.wp.id + '-pageContainer-' + pageNum;
       Dom.addClass(div, "page");
       this.viewer.appendChild(div);
       
       var pageObj = {
             id: '',
             content: content,
             canvas: null,
             container: div
          };
       
       this._setPageSize(pageObj);

       // Add to the list of pages
       this.pages.push(pageObj);
    },
    
    /**
     * 
     */
    _getPageVPos: function PdfJs__getPageVPos(page)
    {
       var vregion = this.viewerRegion,
          pregion = Dom.getRegion(page.container);
       
       return pregion.top - vregion.top;
    },
    
    /**
     * 
     */
    _setPageVPos: function PdfJs__setPageVPos(page)
    {
       var vregion = this.viewerRegion,
          pregion = Dom.getRegion(page.container);
       
       page.vpos = pregion.top - vregion.top;
    },
    
    /**
     * Render a specific page in the container
     * 
     * @method __renderPage
     * @private
     */
    _renderPage: function PdfJs__renderPage(page)
    {
       var region = Dom.getRegion(page.container),
          canvas = document.createElement('canvas');
       canvas.id = page.container.id.replace('-pageContainer-', '-canvas-');
       canvas.mozOpaque = true;
       page.container.appendChild(canvas);
       
       page.canvas = canvas;
       
       var content = page.content,
          view = content.view,
          ctx = canvas.getContext('2d');

       canvas.width = region.width;
       canvas.height = region.height;

       // Fill canvas with a white background
       ctx.save();
       ctx.fillStyle = 'rgb(255, 255, 255)';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       ctx.restore();
       ctx.translate(-view.x * this.currentScale, -view.y * this.currentScale);
       
       // Render the content itself
       content.startRendering(ctx);
    },
   
   /**
    * Set page container size
    * 
    * @method _setPageSize
    * @private
    */
   _setPageSize: function PdfJs__setPageSize(page)
   {
      var pageContainer = page.container, content = page.content,
         height = content.height * this.currentScale,
         width = content.width * this.currentScale;
      Dom.setStyle(pageContainer, "height", "" + Math.floor(height) + "px");
      Dom.setStyle(pageContainer, "width", "" + Math.floor(width) + "px");
   },
   
   /**
    * Remove page canvas and reset dimensions
    * 
    * @method _resetPage
    * @private
    */
   _resetPage: function PdfJs__resetPage(page)
   {  
       this._setPageSize(page);
       
       var div = page.container;
       while (div.hasChildNodes())
       {
          div.removeChild(div.lastChild);
       }

       if (page.canvas)
       {
          delete page.canvas;
          page.canvas = null;
          page.loadingIconDiv = document.createElement('div');
          Dom.addClass(page.loadingIconDiv, 'loadingIcon');
          div.appendChild(page.loadingIconDiv);
       }

   },
   
   /**
    * @method _updatePageControls
    */
   _updatePageControls: function PdfJs__updatePageControls()
   {
      // Update current page number
      this.pageNumber.value = this.pageNum;
      // Update toolbar controls
      this.widgets.nextButton.set("disabled", this.pageNum >= this.pdfDoc.numPages);
      this.widgets.previousButton.set("disabled", this.pageNum <= 1);
   },
   
   /**
    * @method _updateZoomControls
    */
   _updateZoomControls: function PdfJs__updateZoomControls(n)
   {
      // Update zoom controls
      this.widgets.zoomInButton.set("disabled", this.currentScale * this.attributes.scaleDelta > K_MAX_SCALE);
      this.widgets.zoomOutButton.set("disabled", this.currentScale / this.attributes.scaleDelta < K_MIN_SCALE);
      var select = Dom.get(this.wp.id + "-scaleSelect");
      for (var i = 0; i < select.options.length; i++)
      {
         if (this.currentScaleValue == select.options[i].value)
         {
            select.selectedIndex = i;
         }
      }
   },
    
    /**
     * 
     */
    _scrollToPage: function PdfJs__scrollToPage(n)
    {
       var marginTop = parseInt(Dom.getStyle(this.pages[n - 1].container, "margin-top")),
          scrollTop = this._getPageVPos(this.pages[n - 1]) - marginTop;
       this.viewer.scrollTop += scrollTop;
       this.pageNum = n;
       
       // Update toolbar controls
       this._updatePageControls();
       
       // Render visible pages
       this._renderVisiblePages();
    },
    
    /**
     * 
     */
    _setZoomLevel: function PdfJs__setZoomLevel()
    {
       
    },
    
    /*
     * EVENT HANDLERS
     */
    
    /**
     * 
     */
    onPagePrevious: function PdfJs_onPagePrevious(e_obj)
    {
       if (this.pageNum <= 1)
          return;
       this.pageNum--;
       this._scrollToPage(this.pageNum);
    },
    
    /**
     * 
     */
    onPageNext: function PdfJs_onPageNext(e_obj)
    {
       if (this.pageNum >= this.pdfDoc.numPages)
          return;
       this.pageNum++;
       this._scrollToPage(this.pageNum);
    },
    
    /**
     * 
     */
    onPageChange: function PdfJs_onPageChange(e_obj)
    {
       var pn = parseInt(e_obj.currentTarget.value);
       if (pn < 1 || pn > this.numPages)
       {
          Alfresco.util.PopupManager.displayPrompt({
             text: "That is not a valid page number"
          }) 
       }
       else
       {
          this.pageNum = pn;
          this._scrollToPage(this.pageNum);
       }
    },
    
    onViewerScroll: function PdfJs_onViewerScroll(e_obj)
    {
       // Render visible pages
       this._renderVisiblePages();
    },
    
    onZoomOut: function PdfJs_onZoomOut(p_obj)
    {
       var newScale = Math.max(K_MIN_SCALE, this.currentScale / this.attributes.scaleDelta);
       this._setScale(this._parseScale(newScale));
       this.currentScaleValue = newScale;
       this._scrollToPage(this.pageNum);
       this._updateZoomControls();
       
    },
    
    onZoomIn: function PdfJs_onZoomIn(p_obj)
    {
       var newScale = Math.min(K_MAX_SCALE, this.currentScale * this.attributes.scaleDelta);
       this._setScale(this._parseScale(newScale));
       this.currentScaleValue = newScale;
       this._scrollToPage(this.pageNum);
       this._updateZoomControls();
    },
    
    onZoomChange: function PdfJs_onZoomChange(p_obj)
    {
       var newScale = p_obj.currentTarget.options[p_obj.currentTarget.selectedIndex].value;
       this._setScale(this._parseScale(newScale));
       this.currentScaleValue = newScale;
       this._scrollToPage(this.pageNum);
       this._updateZoomControls();
    },
    
    onDownloadClick: function PdfJs_onDownloadClick(p_obj)
    {
       window.location.href = this.wp.getContentUrl();
    },
    
    onMaximizeClick: function PdfJs_onMaximizeClick(p_obj)
    {
       this.maximized = !this.maximized;
       
       if (this.maximized)
       {
          Dom.addClass(this.wp.getPreviewerElement(), "fullPage");
          this.widgets.maximize.set("label", this.wp.msg("button.minimize"));
       }
       else
       {
          Dom.removeClass(this.wp.getPreviewerElement(), "fullPage");
          this.widgets.maximize.set("label", this.wp.msg("button.maximize"));
       }
       
       this._setPreviewerElementHeight();
       this._setViewerHeight();
       // Now redefine the row margins
       this._alignViewerRows();
       // Render any pages that have appeared
       this._renderVisiblePages();
    },
    
    onRecalculatePreviewLayout: function PdfJs_onRecalculatePreviewLayout(p_obj)
    {
       this._setPreviewerElementHeight();
       this._setViewerHeight();
       // Now redefine the row margins
       this._alignViewerRows();
       // Render any pages that have appeared
       this._renderVisiblePages();
    }
};