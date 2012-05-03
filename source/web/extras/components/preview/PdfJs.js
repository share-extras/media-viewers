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
		defaultScale: "auto",
		
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
	      
	      return displaysource;
      }
	   else
      {
	      var shadowDiv = document.createElement("div");
         Dom.addClass(shadowDiv, "previewer");
         Dom.addClass(shadowDiv, "PdfJs");
         Dom.addClass(shadowDiv, "shadowDiv");
         Dom.setStyle(shadowDiv, "height", window.innerHeight);
         document.body.appendChild(shadowDiv);
         this.shadowDiv = shadowDiv;
	      
	      // Viewer HTML is contained in an external web script, which we load via XHR
	      Alfresco.util.Ajax.request({
	         url: Alfresco.constants.URL_SERVICECONTEXT + 'extras/components/preview/pdfjs?htmlid=' + encodeURIComponent(this.wp.id),
	         successCallback: {
	            fn: function(p_obj) {
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
                  this.widgets.nextButton = new YAHOO.widget.Button(
                        this.wp.id + "-next",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onPageNext,
                              scope: this
                           }
                        }
                     );
                  this.widgets.previousButton = new YAHOO.widget.Button(
                        this.wp.id + "-previous",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onPagePrevious,
                              scope: this
                           }
                        }
                     );
                  Event.addListener(this.wp.id + "-pageNumber", "change", this.onPageChange, this, true);
                  this.widgets.zoomOutButton = new YAHOO.widget.Button(
                        this.wp.id + "-zoomOut",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onZoomOut,
                              scope: this
                           }
                        }
                     );
                  this.widgets.zoomInButton = new YAHOO.widget.Button(
                        this.wp.id + "-zoomIn",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onZoomIn,
                              scope: this
                           }
                        }
                     );
                  Event.addListener(this.wp.id + "-scaleSelect", "change", this.onZoomChange, this, true);
                  
                  this.widgets.downloadButton = new YAHOO.widget.Button(
                        this.wp.id + "-download",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onDownloadClick,
                              scope: this
                           }
                        }
                     );
                  
                  this.widgets.maximize = new YAHOO.widget.Button(
                        this.wp.id + "-fullpage",
                        {
                           disabled: false,
                           onclick: {
                              fn: this.onMaximizeClick,
                              scope: this
                           }
                        }
                     );
	               
	               // Set height of the viewer area
	               var controlRegion = Dom.getRegion(this.controls);
	               var previewHeight = this.wp.setupPreviewSize();
                  Dom.setStyle(this.wp.getPreviewerElement(), "height", (previewHeight - 10).toString() + "px");
                  Dom.setStyle(this.viewer, "height", (previewHeight - 10 - controlRegion.height).toString() + "px");

                  this.viewerRegion = Dom.getRegion(this.viewer);
                  
                  this._loadPdf();
	            },
	            scope: this
	         },
	         failureMessage: 'Could not load the viewer component'
	      });
	      return null;
      }
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

      // Update toolbar
      //Dom.get(this.wp.id + "-pageNumber").value = pageNum;
      Dom.get(this.wp.id + "-numPages").textContent = this.numPages;
      
      // Set scale, if not already set
      if (this.currentScale === K_UNKNOWN_SCALE)
      {
        // Scale was not initialized: invalid bookmark or scale was not specified.
        // Setting the default one.
        this._parseScale(this.attributes.defaultScale);
      }
      this._scrollToPage(this.pageNum);
      
	},
   
   /**
    * Set page zoom level
    * 
    * @method _parseScale
    * @private
    */
   _parseScale: function PdfJs__parseScale(value)
   {
       if ('custom' == value)
       {
          return;
       }

       this.currentScaleValue = value;
       var scale = parseFloat(value);
       if (scale)
       {
         this._setScale(scale);
         return;
       }

       var currentPage = this.pages[this.pageNum - 1];
       var vregion = this.viewerRegion;
       var pageWidthScale = (vregion.width) /
                             currentPage.content.width / K_CSS_UNITS;
       var pageHeightScale = (vregion.height) /
                              currentPage.content.height / K_CSS_UNITS;
       
       if ('page-width' == value)
       {
          this._setScale(pageWidthScale);
       }
       else if ('page-height' == value)
       {
          this._setScale(pageHeightScale);
       }
       else if ('page-fit' == value)
       {
          this._setScale(Math.min(pageWidthScale, pageHeightScale));
       }
       else if ('auto' == value)
       {
          this._setScale(Math.min(1.0, pageWidthScale));
       }
       
       // update the UI
       //selectScaleOption(value);
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

      Dom.setStyle(this.viewer, "padding-left", "0px");
      
      var pages = this.pages;
      for (var i = 0; i < pages.length; i++)
      {
         var page = pages[i];
         this._resetPage(page);
         this._setPageVPos(page);
      }

      var rowPos = -1, rowWidth = 0, largestRow = 0;
      if (this.attributes.pageLayout == "multi")
      {
         for (var i = 0; i < pages.length; i++)
         {
            var page = pages[i], container = page.container;
            // If multi-page mode is on, we need to add custom extra margin to the LHS of the 1st item in the row to make it centred
            if (page.vpos != rowPos)
            {
               rowWidth = 0;
            }
            rowWidth += Dom.getRegion(container).width + parseInt(Dom.getStyle(container, "margin-left")) * 2;
            largestRow = Math.max(largestRow, rowWidth);
            rowPos = page.vpos;
         }
         Dom.setStyle(this.viewer, "padding-left", "" + ((this.viewer.clientWidth - largestRow) / 2) + "px");
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
      for (var i = this.pageNum - 1; i < this.pages.length; i++)
      {
         var page = this.pages[i];
         if (!page.canvas && page.vpos < scrollTop + this.viewerRegion.height)
         {
            this._renderPage(page);
            if (i + 1 < this.pages.length)
            {
               this._renderPage(this.pages[i + 1]);
            }
         }
      }
      // TODO render next page? Or one before?
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
       this._setPageVPos(pageObj);

       // Add to the list of pages
       this.pages.push(pageObj);
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
      Dom.setStyle(pageContainer, "height", "" + height + "px");
      Dom.setStyle(pageContainer, "width", "" + width + "px");
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
     * 
     */
    _scrollToPage: function PdfJs__scrollToPage(n)
    {
       var marginTop = parseInt(Dom.getStyle(this.pages[n - 1].container, "margin-top")),
          scrollTop = this.pages[n - 1].vpos - marginTop;
       this.viewer.scrollTop = scrollTop;
       this.pageNum = n;
       
       // Update toolbar controls
       this.pageNumber.value = n;
       this.widgets.nextButton.set("disabled", this.pageNum >= this.pdfDoc.numPages);
       this.widgets.previousButton.set("disabled", this.pageNum <= 1);
       
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
       this._parseScale(newScale);
       this._scrollToPage(this.pageNum);
       
    },
    
    onZoomIn: function PdfJs_onZoomIn(p_obj)
    {
       var newScale = Math.min(K_MAX_SCALE, this.currentScale * this.attributes.scaleDelta);
       this._parseScale(newScale);
       this._scrollToPage(this.pageNum);
    },
    
    onZoomChange: function PdfJs_onZoomChange(p_obj)
    {
       var newScale = p_obj.currentTarget.options[p_obj.currentTarget.selectedIndex].value;
       this._parseScale(newScale);
       this._scrollToPage(this.pageNum);
    },
    
    onDownloadClick: function PdfJs_onDownloadClick(p_obj)
    {
       window.location.href = this.wp.getContentUrl();
    },
    
    onMaximizeClick: function PdfJs_onMaximizeClick(p_obj)
    {
       var src = !this.maximized ? this.viewer : this.shadowDiv,
             target = !this.maximized ? this.shadowDiv : this.viewer;
       
       Dom.setStyle(this.shadowDiv, "display", !this.maximized ? "block" : "none");

       target.appendChild(this.controls);
       target.appendChild(this.viewer);
       
       this.maximized = !this.maximized;
    }
};