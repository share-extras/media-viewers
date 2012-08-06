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

/**
 * This is the "PdfJs" plugin that renders PDF files using the popular pdf.js
 * library. By default the pdf.js libraries are used directly, but in 'iframe'
 * mode it is possible to force the viewer to use the viewer implementation
 * provided by pdf.js within an iframe. This mode may be deprecated in the 
 * future.
 * 
 * Supports the "application/pdf" mime type directly, plus any other type
 * for which a PDF thumbnail definition is available.
 * 
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.PdfJs
 * @author Peter Lšfgren Loftux AB
 * @author Will Abson
 */

(function ()
{
   //IE does not support const
   var K_UNKNOWN_SCALE = 0;
   var K_CSS_UNITS = 96.0 / 72.0;
   var K_MIN_SCALE = 0.25;
   var K_MAX_SCALE = 4.0;

   /**
    * YUI aliases
    */
   var Dom = YAHOO.util.Dom, 
      Event = YAHOO.util.Event, 
      Element = YAHOO.util.Element;

   /**
    * PdfJs plug-in constructor
    * 
    * @constructor
    * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
    * @param attributes {object} Arbitrary attributes brought in from the <plugin> element
    */
   Alfresco.WebPreview.prototype.Plugins.PdfJs = function(wp, attributes)
   {
      this.wp = wp;
      this.id = wp.id; // needed by Alfresco.util.createYUIButton
      this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
      return this;
   };
   
   Alfresco.WebPreview.prototype.Plugins.PdfJs.prototype =
   {
      /**
       * Configuration attributes
       * 
       * @property attributes
       * @type object
       */
      attributes:
      {
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
          * Skipbrowser test, mostly for developer to force test loading. Valid
          * options "true" "false" as String.
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
          * @default "block"
          */
         mode: "block",
   
         /**
          * Default zoom level for new documents
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
          * Minimum scale level to use when auto-scaling a document
          * 
          * @property autoMinScale
          * @type String
          * @default "0.7"
          */
         autoMinScale: "0.7",
   
         /**
          * Layout to use to display pages, "single" (one page per row) or "multi" (multiple pages per row)
          * 
          * @property pageLayout
          * @type String
          * @default "multi"
          */
         pageLayout: "multi",
         
         /**
          * Whether text overlays on pages should be disabled. Overlays allow users to select text
          * content in their browser but reduce rendering performance.
          * 
          * @property disableTextLayer
          * @type String
          * @default "false"
          */
         disableTextLayer: "false",
         
         /**
          * Whether to use HTML5 browser storage to persist the page number and zoom level of previously-viewed documents
          * 
          * @property useLocalStorage
          * @type String
          * @default "true"
          */
         useLocalStorage: "true"
      },
      
      /**
       * Cached PDF document, once loaded from the server
       * 
       * @property pdfDoc
       * @type {object}
       * @default null
       */
      pdfDoc: null,
      
      /**
       * Current page number
       * 
       * @property pageNum
       * @type int
       * @default 1
       */
      pageNum: 1,
      
      /**
       * Cached pages from the PDF doc
       * 
       * @property pages
       * @type {array}
       * @default []
       */
      pages: [],
      
      /**
       * Cached page text from the document, for searching purposes
       * 
       * @property pageText
       * @type {array}
       * @default []
       */
      pageText: [],
      
      /**
       * Total number of pages in the current document
       * 
       * @property numPages
       * @type int
       * @default 0
       */
      numPages: 0,
      
      /**
       * YUI widgets container
       * 
       * @property widgets
       * @type object
       * @default {}
       */
      widgets: {},
      
      /**
       * Whether the page view is maximised within the client
       * 
       * @property maximized
       * @type boolean
       * @default false
       */
      maximized: false,
      
      /**
       * Counter for pages area scroll events - incremented on event, decremented some time later. Rendering will occur only when counter reaches zero.
       * 
       * TODO Move this property into the DocumentView class
       * 
       * @property renderOnScrollZero
       * @type int
       * @default 0
       */
      renderOnScrollZero: 0,

      /**
       * Counter for thumbnail area scroll events - incremented on event, decremented some time later
       * 
       * TODO Move this property into the DocumentView class
       * 
       * @property renderOnThumbnailsScrollZero
       * @type int
       * @default 0
       */
      renderOnThumbnailsScrollZero: 0,
      
      /**
       * Stored configuration for this particular document, including page number and zoom level. Persisted to local browser storage.
       * 
       * @property documentConfig
       * @type {object}
       * @default {}
       */
      documentConfig: {},
      
      /**
       * Whether the previewer is embedded in a wiki page
       * 
       * @property inWikiPage
       * @type boolean
       * @default false
       */
      inWikiPage: false,
      
      /**
       * Whether the previewer is embedded in a dashlet
       * 
       * @property inDashlet
       * @type boolean
       * @default false
       */
      inDashlet: false,
   
      /**
       * Tests if the plugin can be used in the users browser.
       * 
       * @method report
       * @return {String} Returns nothing if the plugin may be used, otherwise
       *         returns a message containing the reason it cant be used as a
       *         string.
       * @public
       */
      report: function PdfJs_report()
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
   
         }
         else
         {
            canvassupport = true;
         }
   
         // If neither is supported, then report this, and bail out as viewer
         if (canvassupport === false && skipbrowsertest === false)
         {
            return this.wp.msg("label.browserReport", "&lt;canvas&gt; element");
         }
         
         // Try to detect bug http://code.google.com/p/chromium/issues/detail?id=122465 (seems to be triggered by all PDFs generated by OpenOffice)
         if (this.attributes.src && YAHOO.env.ua.os == "windows" && YAHOO.env.ua.chrome >= 16.0)
         {
            return this.wp.msg("label.browserReport", "PDF renditions generated by OpenOffice");
         }
      },
   
      /**
       * Display the node.
       * 
       * @method display
       * @public
       */
      display: function PdfJs_display()
      {
         this.inWikiPage = Dom.getAncestorByClassName(this.wp.getPreviewerElement(), "wiki-page") != null;
         this.inDashlet = Dom.getAncestorByClassName(this.wp.getPreviewerElement(), "body") != null;
         
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
             + '" scrolling="yes" marginwidth="0" marginheight="0" frameborder="0" vspace="5" hspace="5"  style="height:' + previewHeight.toString()
             + 'px;"></iframe>';
             
             // Return HTML that will be set as the innerHTML of the previewer
             return displaysource;
         }
         else
         {
             Alfresco.util.YUILoaderHelper.require(["tabview"], this.onComponentsLoaded, this);
             Alfresco.util.YUILoaderHelper.loadComponents();
             
             // Return null means WebPreview instance will not overwrite the innerHTML of the preview area
             return null;
         }
      },
   
      /**
       * Required YUI components have been loaded
       * 
       * @method onComponentsLoaded
       * @public
       */
      onComponentsLoaded : function PdfJs_onComponentsLoaded()
      {
         if (!this.inWikiPage && !this.inDashlet)
         {
            this._loadDocumentConfig();
         }
         
         // Set page number
         var urlParams = Alfresco.util.getQueryStringParameters(window.location.hash.replace("#", ""));
         this.pageNum = urlParams.page || (this.documentConfig.pageNum ? parseInt(this.documentConfig.pageNum) : this.pageNum);
         
         // Viewer HTML is contained in an external web script, which we load via XHR, then onViewerLoad() does the rest
         Alfresco.util.Ajax.request({
            url: Alfresco.constants.URL_SERVICECONTEXT + 'extras/components/preview/pdfjs?htmlid=' + encodeURIComponent(this.wp.id),
            successCallback: {
               fn: this.onViewerLoaded,
               scope: this
            },
            failureMessage: this.wp.msg("error.viewerload")
         });
         
         if (!this.inWikiPage)
         {
            // Window resize behaviour
            Event.addListener(window, "resize", this.onRecalculatePreviewLayout, this, true);
            
            // Hash change behaviour
            Event.addListener(window, "hashchange", this.onWindowHashChange, this, true);
            
            // Window unload behaviour
            Event.addListener(window, "beforeunload", this.onWindowUnload, this, true);
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
         this.sidebar = Dom.get(this.wp.id + "-sidebar");
         this.viewer = Dom.get(this.wp.id + "-viewer");
         Event.addListener(this.viewer, "scroll", function (e) {
            this.renderOnScrollZero++;
            YAHOO.lang.later(500, this, this.onViewerScroll);
         }, this, true);
         
         // Set up viewer
         if (this.attributes.pageLayout == "multi")
         {
            Dom.addClass(this.viewer, "multiPage");
         }
         
         // Set up toolbar
         this.widgets.sidebarButton = Alfresco.util.createYUIButton(this, "sidebarBtn", this.onSidebarToggle, {type: "checkbox"});
         this.widgets.nextButton = Alfresco.util.createYUIButton(this, "next", this.onPageNext);
         this.widgets.previousButton = Alfresco.util.createYUIButton(this, "previous", this.onPagePrevious);
         Event.addListener(this.wp.id + "-pageNumber", "change", this.onPageChange, this, true);
         this.widgets.zoomOutButton = Alfresco.util.createYUIButton(this, "zoomOut", this.onZoomOut);
         this.widgets.zoomInButton = Alfresco.util.createYUIButton(this, "zoomIn", this.onZoomIn);
         this.widgets.scaleMenu = new YAHOO.widget.Button(this.id + "-scaleSelectBtn", {
            type: "menu",
            menu: this.id + "-scaleSelect"
         });
         this.widgets.scaleMenu.getMenu().subscribe("click", this.onZoomChange, null, this);
         var downloadMenu = [
            { text: this.wp.msg("link.download"), value: "", onclick: { fn: this.onDownloadClick, scope: this } },
         ];
         if (this.attributes.src)
         {
            downloadMenu.push({ text: this.wp.msg("link.downloadPdf"), value: "", onclick: { fn: this.onDownloadPDFClick, scope: this } });
         }
         this.widgets.downloadButton = new YAHOO.widget.Button(this.id + "-download", {
            type: "menu",
            menu: downloadMenu
         });
         this.widgets.maximize = Alfresco.util.createYUIButton(this, "fullpage", this.onMaximizeClick);
         this.widgets.linkBn = Alfresco.util.createYUIButton(this, "link", this.onLinkClick);
         
         // Set height of the container and the viewer area
         this._setPreviewerElementHeight();
         this._setViewerHeight();
         
         // Load the PDF itself
         this._loadPdf();
         
         // Keyboard shortcuts
         if (!this.inWikiPage && !this.inDashlet)
         {
            new YAHOO.util.KeyListener(document, { keys: 37 }, { // left arrow
               fn: this.onPagePrevious, 
               scope: this, 
               correctScope: true
            }).enable();
            new YAHOO.util.KeyListener(document, { keys: 39 }, { // right arrow
               fn: this.onPageNext, 
               scope: this, 
               correctScope: true
            }).enable();
         }
         new YAHOO.util.KeyListener(document, { keys: 27 }, { // escape
            fn: function (e) {
               if (this.maximized)
               {
                  this.onMaximizeClick();
               }
            }, 
            scope: this, 
            correctScope: true
         }).enable();
      },
      
      /**
       * Set the height of the preview element
       * 
       * @method _setPreviewerElementHeight
       * @private
       */
      _setPreviewerElementHeight: function _setPreviewerElementHeight()
      {
         // Is the viewer maximized?
         if (!this.maximized)
         {
            if (this.inDashlet)
            {
               Dom.setStyle(this.wp.getPreviewerElement(), "height", "100%");
            }
            else if (!this.inWikiPage)
            {
               var previewHeight = this.wp.setupPreviewSize();
               Dom.setStyle(this.wp.getPreviewerElement(), "height", (previewHeight - 10).toString() + "px");
            }
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
         var previewRegion = Dom.getRegion(this.viewer.parentNode),
            controlRegion = Dom.getRegion(this.controls),
            newHeight = (previewRegion.height - controlRegion.height).toString() + "px";
         Dom.setStyle(this.viewer, "height", newHeight);
         Dom.setStyle(this.sidebar, "height", newHeight);
      },
      
      /**
       * Fetch the PDF content and display it
       * 
       * @method _loadPdf
       * @private
       */
      _loadPdf: function PdfJs__loadPdf()
      {
         var me = this,
            fileurl = this.attributes.src ? this.wp.getThumbnailUrl(this.attributes.src) : this.wp.getContentUrl();
         
         // Add the loading spinner to the viewer area
         Dom.addClass(this.viewer, "loading");
   
         //Set the worker source
         PDFJS.workerSrc = Alfresco.constants.URL_CONTEXT + 'res/extras/components/preview/pdfjs/pdf' +  (Alfresco.constants.DEBUG ? '.js' : '-min.js'); 
         
         PDFJS.getDocument(fileurl).then(function(pdf) {
         	me.pdfDoc = pdf;
         	me.numPages = me.pdfDoc.numPages;
         	me._renderPdf.call(me);
         	me._updatePageControls();
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
         var pagePromises = [], pagesRefMap = {}, pagesCount = this.numPages;
         for (var i = 1; i <= pagesCount; i++)
         {
           pagePromises.push(this.pdfDoc.getPage(i));
         }
         var pagesPromise = PDFJS.Promise.all(pagePromises);
   
         var destinationsPromise = this.pdfDoc.getDestinations();
         
         var renderPageContainer = Alfresco.util.bind(function (promisedPages)
         {
            this.documentView = new DocumentView(this.id + "-viewer", {
               pageLayout: this.attributes.pageLayout,
               currentScale: this.documentConfig.scale ? parseFloat(this.documentConfig.scale) : K_UNKNOWN_SCALE,
               defaultScale: this.attributes.defaultScale,
               disableTextLayer: this.attributes.disableTextLayer == "true",
               autoMinScale: parseFloat(this.attributes.autoMinScale)
            });
            this.thumbnailView = new DocumentView(this.id + "-thumbnailView", {
               pageLayout: "single",
               defaultScale: "page-width",
               disableTextLayer: true
            });
            this.pages = promisedPages;
            this.documentView.addPages(promisedPages);
            this.thumbnailView.addPages(promisedPages);
            
            for (var i = 0; i < promisedPages.length; i++)
            {
               var page = promisedPages[i], pageRef = page.ref;
               pagesRefMap[pageRef.num + ' ' + pageRef.gen + ' R'] = i;
            }
   
            // Remove the loading spinner
            Dom.removeClass(this.viewer, "loading");
            
            this.documentView.render();
            // Scroll to the current page, this will force the visible content to render
            this.documentView.scrollTo(this.pageNum);
            
            // Enable the sidebar
            
            // Update toolbar
            this._updateZoomControls();
            Dom.get(this.wp.id + "-numPages").textContent = this.numPages;
           }, this);
         
         var setDestinations = Alfresco.util.bind(function (destinations) {
            this.destinations = destinations;
         }, this);
   
         var getOutline = Alfresco.util.bind(function (outline) {
            this._addOutline(outline);
         }, this);
         var setupOutline = Alfresco.util.bind(function () {
            this.pdfDoc.getOutline().then(getOutline);
         }, this);
        
         pagesPromise.then(renderPageContainer);
   
         this.pagesRefMap = pagesRefMap;
         
         destinationsPromise.then(setDestinations);
   
         // outline view depends on destinations and pagesRefMap
         PDFJS.Promise.all([pagesPromise, destinationsPromise]).then(setupOutline);
      },
      
      /**
       * Update the paging controls shown in the toolbar
       * 
       * @method _updatePageControls
       * @private
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
       * Update the zoom controls shown in the toolbar
       * 
       * @method _updateZoomControls
       * @private
       */
      _updateZoomControls: function PdfJs__updateZoomControls(n)
      {
         // Update zoom controls
         var scale = this.documentView.currentScale;
         this.widgets.zoomInButton.set("disabled", scale * this.attributes.scaleDelta > K_MAX_SCALE);
         this.widgets.zoomOutButton.set("disabled", scale / this.attributes.scaleDelta < K_MIN_SCALE);
         this.widgets.scaleMenu.set("label", "" + Math.round(scale * 100) + "%");
      },
      
      /**
       * Scroll the displayed document to the specified page
       * 
       * @method _scrollToPage
       * @param n {int} Number of the page to scroll to, must be 1 or greater.
       * @private
       */
      _scrollToPage: function PdfJs__scrollToPage(n)
      {
         this.documentView.scrollTo(n);
         this.pageNum = n;
         
         // Update toolbar controls
         this._updatePageControls();
         
         // Update sidebar, if visible
         // TODO define an isRendered() method on the view object
         if (this.thumbnailView.pages && this.thumbnailView.pages[0] && this.thumbnailView.pages[0].container)
         {
            this.thumbnailView.setActivePage(this.pageNum);
         }
      },
      
      /**
       * Use the specified document outline object to render a basic outline view in the sidebar
       * 
       * TODO Use an event to load this only when the docunent outline tab is first displayed
       * 
       * @method _addOutline
       * @param outline {object} Outline object as passed to us by pdf.js
       * @private
       */
      _addOutline: function PdfJs__addOutline(outline)
      {
         var pEl = Dom.get(this.id + "-outlineView");
         
         if (outline && outline.length > 0)
         {
            var queue = [{parent: pEl, items: outline}];
            while (queue.length > 0)
            {
               var levelData = queue.shift();
               var i, n = levelData.items.length;
               for (i = 0; i < n; i++)
               {
                  var item = levelData.items[i];
                  var div = document.createElement('div');
                  div.className = 'outlineItem';
                  var a = document.createElement('a');
                  Dom.setAttribute(a, "href", "#");
                  YAHOO.util.Event.addListener(a, "click", function(e, obj) {
                     this._navigateTo(obj);
                     }, item.dest, this);
                  a.textContent = item.title;
                  div.appendChild(a);
                  
                  if (item.items.length > 0) {
                     var itemsDiv = document.createElement('div');
                     itemsDiv.className = 'outlineItems';
                     div.appendChild(itemsDiv);
                     queue.push({parent: itemsDiv, items: item.items});
                  }
   
                  levelData.parent.appendChild(div);
               }
            }
         }
         else
         {
            pEl.innerHTML = "<p>" + this.wp.msg("msg.noOutline") + "</p>";
         }
      },
      
      /**
       * Navigate the viewer to the specified document outline item
       * 
       * @method _navigateTo
       * @param dest {object} outline object item, from the document outline
       * @private
       */
      _navigateTo: function PdfJs__navigateTo(dest)
      {
        if (typeof dest === 'string')
          dest = this.destinations[dest];
        if (!(dest instanceof Array))
          return; // invalid destination
        // dest array looks like that: <page-ref> </XYZ|FitXXX> <args..>
        var destRef = dest[0];
        var pageNumber = destRef instanceof Object ?
          this.pagesRefMap[destRef.num + ' ' + destRef.gen + ' R'] : (destRef + 1);
        if (pageNumber > this.documentView.pages.length - 1)
          pageNumber = this.documentView.pages.length - 1;
        if (typeof pageNumber == "number") {
           this._scrollToPage(pageNumber + 1);
        }
      },
      
      /**
       * Start text extraction from the given page number (zero-based) and store locally for searching. Can only be called after the pages property has been set.
       * 
       * This function calls itself recursively as many times as needed until all available pages have had their text extracted.
       * 
       * @method _extractText
       * @param pageIndex {int} page number to start extraction at, 0 or greater
       * @private
       */
      _extractText: function(pageIndex)
      {
         if (this.startedTextExtraction)
            return;
         this.startedTextExtraction = true;
         var self = this;
         function extractPageText(pageIndex) {
            self.pages[pageIndex].getTextContent().then(
               function textContentResolved(textContent) {
                  self.pageText[pageIndex] = textContent;
                  if ((pageIndex + 1) < self.pages.length)
                     extractPageText(pageIndex + 1);
                  }
               );
         };
         extractPageText(0);
      },
      
      /**
       * Perform a search for the given term and return an array of matching results
       * 
       * @method _textSearch
       * @param {string} searchTerm Search term to use for searching
       * @returns {array} Array of objects containing properties 'pageNum', 'textContent' and 'matchPos'.
       * @private
       */
      _textSearch: function PdfJs__textSearch(searchTerm)
      {
         if (!searchTerm)
         {
            return;
         }
         var results = [];
         searchTerm = searchTerm.replace(/[\s-]+/g, ' ');
         for (var i = 0, ii = this.pageText.length; i < ii; i++)
         {
            var textContent = this.pageText[i];
            if (!textContent)
            {
               continue;
            }
            var matchPos = textContent.replace("&nbsp;", " ").replace(/[\s-]+/g, ' ').toLowerCase().indexOf(searchTerm.toLowerCase());
            if (matchPos > -1)
            {
               results.push({pageNum: i+1, text: textContent, matchPos: matchPos});
            }
            
         }
         return results;
      },
      
      /**
       * Mark selected search hits in the selected page. Not currently implemented, this is a placeholder only.
       * 
       * @method _textMark
       * @param i {int} page number to mark up text in
       * @private
       */
      _textMark: function PdfJs__textMark(i)
      {
         var page = this.documentView.pages[i];
         if (page.textLayerDiv && page.textLayerDiv.firstChild)
         {
            for (var j = 0; j < page.textLayerDiv.childNodes.length; j++)
            {
               var childEl = page.textLayerDiv.childNodes[j],
                  textContent = (childEl.textContent || childEl.innerText).replace("&nbsp;", " ").replace(/[\s-]+/g, ' '),
                  matchPos = textContent.toLowerCase().indexOf(searchTerm.toLowerCase());
               if (matchPos > -1)
               {
                  results.push({pageNum: i+1, text: textContent, matchPos: matchPos});
               }
            }
         }
      },
      
      /**
       * Load configuration for the current document
       * 
       * @method _loadDocumentConfig
       * @private
       */
      _loadDocumentConfig: function PdfJs__loadDocumentConfig()
      {
         if (this.attributes.useLocalStorage != "true" || !this._browserSupportsHtml5Storage())
         {
            this.documentConfig = {};
         }
         else
         {
            var base = "org.sharextras.media-viewers.pdfjs.document." + this.wp.options.nodeRef.replace(":/", "").replace("/", ".") + ".";
            this.documentConfig = {
               pageNum: window.localStorage[base + "pageNum"],
               scale: window.localStorage[base + "scale"]
            };
         }
      },
      
      /**
       * Check if the web browser supports local storage
       * 
       * @property _browserSupportsHtml5Storage
       * @returns {boolean} true if local storage is available, false otherwise
       */
      _browserSupportsHtml5Storage: function PdfJs__browserSupportsHtml5Storage()
      {
         try
         {
           return 'localStorage' in window && window['localStorage'] !== null;
         }
         catch (e)
         {
           return false;
         }
      },
       
       /*
        * EVENT HANDLERS
        */
       
       /**
        * Toggle sidebar button click handler
        * 
        * @method onSidebarToggle
        */
       onSidebarToggle: function PdfJs_onSidebarToggle(e_obj)
       {
          var sbshown = Dom.getStyle(this.sidebar, "display") == "block";
          Dom.setStyle(this.sidebar, "display", sbshown ? "none" : "block");
          if (sbshown)
          {
             Dom.removeClass(this.viewer, "sideBarVisible");
          }
          else
          {
             Dom.addClass(this.viewer, "sideBarVisible");
          }
          this.documentView.alignRows();
          // Render any pages that have appeared
          this.documentView.renderVisiblePages();
          
          var goToPage = function goToPage(e, obj) {
             this._scrollToPage(obj.pn);
          };
          
          var doSearch = function PdfJs_doSearch(e, obj) {
             var term = Dom.get(this.id + "-searchBox").value,
             results = this._textSearch(term),
             resultsEl = Dom.get(this.id + "-searchResults");
          
             if (results.length > 0)
             {
                resultsEl.innerHTML = "<p>" + this.wp.msg("msg.results", results.length) + "</p>";
                for (var i = 0; i < results.length; i++)
                {
                   var result = results[i];
                   var divEl = document.createElement("div");
                   var linkEl = document.createElement("a");
                   var textSample = result.text.substr(result.matchPos, 50);
                   divEl.appendChild(linkEl);
                   linkEl.innerHTML = "<span>" + this.wp.msg("msg.resultPage", result.pageNum) + "</span>: " + textSample;
                   Dom.setAttribute(linkEl, "href", "#");
                   YAHOO.util.Event.addListener(linkEl, "click", goToPage, {pn: result.pageNum}, this);
                   resultsEl.appendChild(divEl);
                }
             }
             else
             {
                resultsEl.innerHTML = "<p>" + this.wp.msg("msg.noResults") + "</p>";
             }
          }
          
          // Lazily instantiate the TabView
          this.widgets.tabview = this.widgets.tabview || new YAHOO.widget.TabView(this.id + "-sidebarTabView");
          
          // Set up the search when the tab is clicked
          this.widgets.tabview.getTab(2).addListener("click", function() {
             // Start text extraction as soon as the search gets displayed.
             this._extractText(0);
   
             Alfresco.util.createYUIButton(this, "searchBtn", doSearch);
             new YAHOO.util.KeyListener(this.id + "-searchBox", { keys: 13 }, { // enter
                fn: doSearch, 
                scope: this, 
                correctScope: true
             }).enable();
             
          }, this, true);
   
          // Set up the thumbnail view immediately
          if (this.thumbnailView.pages.length > 0 && !this.thumbnailView.pages[0].container)
          {
             this.thumbnailView.render();
             for (var i = 0; i < this.thumbnailView.pages.length; i++)
             {
                YAHOO.util.Event.addListener(this.thumbnailView.pages[i].container, "click", function(e, obj) {
                   this.thumbnailView.setActivePage(obj.pn);
                   this.documentView.scrollTo(obj.pn);
                }, {pn: i+1}, this);
             }
             // Scroll to the current page, this will force the visible content to render
             this.thumbnailView.scrollTo(this.pageNum);
             this.thumbnailView.setActivePage(this.pageNum);
             YAHOO.util.Event.addListener(this.id + "-thumbnailView", "scroll", function (e) {
                this.renderOnThumbnailsScrollZero++;
                YAHOO.lang.later(500, this, this.onThumbnailsScroll);
             }, this, true);
          }
       },
       
       /**
        * Previous page button or key clicked
        * 
        * @method onPagePrevious
        */
       onPagePrevious: function PdfJs_onPagePrevious(e_obj)
       {
          if (this.pageNum <= 1)
             return;
          this.pageNum--;
          this._scrollToPage(this.pageNum);
       },
       
       /**
        * Next button or key clicked
        * 
        * @method onPageNext
        */
       onPageNext: function PdfJs_onPageNext(e_obj)
       {
          if (this.pageNum >= this.pdfDoc.numPages)
             return;
          this.pageNum++;
          this._scrollToPage(this.pageNum);
       },
       
       /**
        * Page number changed in text input field
        * 
        * @method onPageChange
        */
       onPageChange: function PdfJs_onPageChange(e_obj)
       {
          var pn = parseInt(e_obj.currentTarget.value);
          if (pn < 1 || pn > this.numPages)
          {
             Alfresco.util.PopupManager.displayPrompt({
                text: this.wp.msg('error.badpage')
             });
          }
          else
          {
             this.pageNum = pn;
             this._scrollToPage(this.pageNum);
          }
       },
       
       /**
        * Event handler for scroll event within the page view area
        * 
        * @method onViewerScroll
        */
       onViewerScroll: function PdfJs_onViewerScroll(e_obj)
       {
          this.renderOnScrollZero --;
          if (this.renderOnScrollZero == 0)
          {
             // Render visible pages
             this.documentView.renderVisiblePages();
             
             var newPn = this.documentView.getScrolledPageNumber();
             if (this.pageNum != newPn)
             {
                this.pageNum = newPn;
                this._updatePageControls();
             }
          }
       },

       /**
        * Event handler for scroll event within the thumbnail area
        * 
        * @method onThumbnailsScroll
        */
       onThumbnailsScroll: function PdfJs_onThumbnailsScroll(e_obj)
       {
          this.renderOnThumbnailsScrollZero --;
          if (this.renderOnThumbnailsScrollZero == 0)
          {
             // Render visible pages
             this.thumbnailView.renderVisiblePages();
          }
       },
       
       /**
        * Zoom out button clicked
        * 
        * @method onZoomOut
        */
       onZoomOut: function PdfJs_onZoomOut(p_obj)
       {
          var newScale = Math.max(K_MIN_SCALE, this.documentView.currentScale / this.attributes.scaleDelta);
          this.documentView.setScale(this.documentView.parseScale(newScale));
          this._scrollToPage(this.pageNum);
          this._updateZoomControls();
          
       },

       /**
        * Zoom in button clicked
        * 
        * @method onZoomIn
        */
       onZoomIn: function PdfJs_onZoomIn(p_obj)
       {
          var newScale = Math.min(K_MAX_SCALE, this.documentView.currentScale * this.attributes.scaleDelta);
          this.documentView.setScale(this.documentView.parseScale(newScale));
          this._scrollToPage(this.pageNum);
          this._updateZoomControls();
       },

       /**
        * Zoom level changed via the zoom menu button
        * 
        * @method onZoomChange
        */
       onZoomChange: function PdfJs_onZoomChange(p_sType, p_aArgs)
       {
          var oEvent = p_aArgs[0], // DOM event
             oMenuItem = p_aArgs[1]; // MenuItem instance that was the target of the event
          
          var newScale = oMenuItem.value;
          this.documentView.setScale(this.documentView.parseScale(newScale));
          this._scrollToPage(this.pageNum);
          this._updateZoomControls();
       },
       
       /**
        * Download Original document menu link click handler
        * 
        * @method onDownloadClick
        */
       onDownloadClick: function PdfJs_onDownloadClick(p_obj)
       {
          window.location.href = this.wp.getContentUrl(true);
       },
       
       /**
        * Download PDF click handler (for thumbnailed content only)
        * 
        * @method onDownloadPDFClick
        */
       onDownloadPDFClick: function PdfJs_onDownloadPDFClick(p_obj)
       {
          window.location.href = this.wp.getThumbnailUrl(this.attributes.src) + "&a=true";
       },
       
       /**
        * Maximize/Minimize button clicked
        * 
        * @method onMaximizeClick
        */
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
          // TODO viewerRegion should be populated by an event?
          this.documentView.viewerRegion = Dom.getRegion(this.viewer);
          // Now redefine the row margins
          this.documentView.alignRows();
          // Render any pages that have appeared
          this.documentView.renderVisiblePages();
          this.thumbnailView.renderVisiblePages();
       },
       
       /**
        * Link button click handler
        * 
        * @method onLinkClick
        */
       onLinkClick: function PdfJs_onLinkClick(p_obj)
       {
          var dialogid = this.id + "-linkDialog",
             inputid = dialogid + "-input";
          
          var fnSelectLink = function PdfJs_onLinkClick_fnSelectLink() {
             var btnid = this.widgets.linkDialogBg.get('checkedButton').get('id');
             var link = window.location.href.replace(window.location.hash, "") + (btnid.indexOf("-doc") > 0 ? "" : "#page=" + this.pageNum);
             var iel = Dom.get(inputid);
             iel.value = link;
             iel.focus();
             iel.select();
          };
          
          if (!this.widgets.linkDialog)
          {
             var linkDialog = new YAHOO.widget.SimpleDialog(dialogid,
             {
                close: true,
                draggable: false,
                effect: null,
                modal: false,
                visible: false,
                context: [this.viewer, "tr", "tr", ["beforeShow", "windowResize"]],
                width: "40em"
             });
             var slideurl = window.location.href.replace(window.location.hash, "") + "#page=" + this.pageNum;
             linkDialog.render();
             
             var linkDialogBg = new YAHOO.widget.ButtonGroup(dialogid + "-bg");
             for (var i = 0; i < linkDialogBg.getCount(); i++)
             {
                linkDialogBg.getButton(i).addListener("click", fnSelectLink, null, this);
             }
             
             this.widgets.linkDialogBg = linkDialogBg;
             this.widgets.linkDialog = linkDialog;
             
             YAHOO.util.Event.addListener(inputid, "click", function() {
                this.focus();
                this.select();
             });
          }
          if (!this.widgets.linkDialog.cfg.getProperty("visible"))
          {
             this.widgets.linkDialog.show();
             fnSelectLink.call(this);
          }
          else
          {
             this.widgets.linkDialog.hide();
          }
       },
       
       /**
        * Handler for window resize event
        * 
        * @method onRecalculatePreviewLayout
        */
       onRecalculatePreviewLayout: function PdfJs_onRecalculatePreviewLayout(p_obj)
       {
          this._setPreviewerElementHeight();
          this._setViewerHeight();
          // TODO viewerRegion should be populated by an event?
          this.documentView.viewerRegion = Dom.getRegion(this.viewer);
          // Now redefine the row margins
          this.documentView.alignRows();
          // Render any pages that have appeared
          this.documentView.renderVisiblePages();
          this.thumbnailView.renderVisiblePages();
       },
       
       /**
        * Handler for window hashchange event
        * 
        * See http://caniuse.com/#search=hash
        * 
        * @method onWindowHashChange
        */
       onWindowHashChange: function PdfJs_onWindowHashChange(p_obj)
       {
          // Set page number
          var urlParams = Alfresco.util.getQueryStringParameters(window.location.hash.replace("#", ""));
          pn = urlParams.page;
          
          if (pn)
          {
             if (pn > this.pdfDoc.numPages || pn < 1)
             {
                Alfresco.util.PopupManager.displayPrompt({
                   text: this.wp.msg('error.badpage')
                });
             }
             else
             {
                this.pageNum = pn;
                this._scrollToPage(this.pageNum);
             }
          }
       },
   
       /**
        * Window unload event handler to save document configuration to local storage
        * 
        * @method onWindowUnload
        */
       onWindowUnload: function PdfJs_onWindowUnload()
       {
          if (this.attributes.useLocalStorage == "true" && this._browserSupportsHtml5Storage())
          {
             var base = "org.sharextras.media-viewers.pdfjs.document." + this.wp.options.nodeRef.replace(":/", "").replace("/", ".") + ".";
             window.localStorage[base + "pageNum"] = this.pageNum;
             window.localStorage[base + "scale"] = this.documentView.currentScale;
          }
       }
   };
   
   /**
    * Page helper class
    */
   var DocumentPage = function(id, content, parent, config)
   {
      this.id = id;
      this.content = content;
      this.parent = parent;
      this.canvas = null;
      this.container = null;
      this.loadingIconDiv = null;
      this.textLayerDiv = null;
      this.config = config || {};
   }
   
   DocumentPage.prototype =
   {
      /**
       * Render a specific page in the container. This does not render the content of the page itself, just the container divs.
       * 
       * @method _renderPageContainer
       * @private
       */
      render: function DocumentPage_render()
      {
          var div = document.createElement('div');
          div.id = this.parent.id + '-pageContainer-' + this.id;
          Dom.addClass(div, "page");
          this.parent.viewer.appendChild(div);
   
          // Create the loading indicator div
          var loadingIconDiv = document.createElement('div');
          Dom.addClass(loadingIconDiv, 'loadingIcon');
          div.appendChild(loadingIconDiv);
          
          this.container = div;
          this.loadingIconDiv = loadingIconDiv;
          
          this._setPageSize();
       },
       
       /**
        * Get the vertical position of the pae relative to the top of the parent element. A negative number
        * means that the page is above the current scroll position, a positive number means it is below.
        * 
        * @method getVPos
        */
       getVPos: function DocumentPage_getVPos(page)
       {
          var vregion = this.parent.viewerRegion,
             pregion = Dom.getRegion(this.container);
          
          return pregion.top - vregion.top;
       },
       
       /**
        * Render page content
        * 
        * @method renderContent
        */
       renderContent: function DocumentPage_renderContent()
       {
          if (this.loadingIconDiv)
          {
             Dom.setStyle(this.loadingIconDiv, "display", "none");
          }
          var region = Dom.getRegion(this.container),
             canvas = document.createElement('canvas');
          canvas.id = this.container.id.replace('-pageContainer-', '-canvas-');
          canvas.mozOpaque = true;
          this.container.appendChild(canvas);
          
          this.canvas = canvas;
          
          // Add text layer
          var textLayerDiv = null;
          if (!this.parent.config.disableTextLayer)
          {
             textLayerDiv = document.createElement('div');
             textLayerDiv.className = 'textLayer';
             this.container.appendChild(textLayerDiv);
          }
          this.textLayerDiv = textLayerDiv;
          var textLayer = textLayerDiv ? new TextLayerBuilder(textLayerDiv) : null;
          
          var content = this.content,
             view = content.view,
             ctx = canvas.getContext('2d');
   
          canvas.width = region.width;
          canvas.height = region.height;
   
          // Fill canvas with a white background
          ctx.save();
          ctx.fillStyle = 'rgb(255, 255, 255)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
          ctx.translate(-view[0] * this.parent.currentScale, -view[1] * this.parent.currentScale);
          
          // Render the content itself
          var renderContext = {
                  canvasContext: ctx,
                  viewport: this.content.getViewport(this.parent.parseScale(this.parent.currentScale)),
                  textLayer: textLayer
                };
         content.render(renderContext);
       },
      
      /**
       * Set page container size
       * 
       * @method _setPageSize
       * @private
       */
      _setPageSize: function DocumentPage__setPageSize(page)
      {
         var pageContainer = this.container, content = this.content,
            viewPort = content.getViewport(this.parent.currentScale);
         Dom.setStyle(pageContainer, "height", "" + Math.floor(viewPort.height) + "px");
         Dom.setStyle(pageContainer, "width", "" + Math.floor(viewPort.width) + "px");
      },
      
      /**
       * Remove page canvas and reset dimensions
       * 
       * @method _reset
       * @private
       */
      reset: function DocumentPage_reset()
      {
          this._setPageSize();
          
          // Remove any existing page canvas
          if (this.canvas)
          {
             this.container.removeChild(this.canvas);
             delete this.canvas;
             this.canvas = null;
          }
          
          if (this.loadingIconDiv)
          {
             Dom.setStyle(this.loadingIconDiv, "display", "block");
          }
      }
   }
   
   /**
    * Document View utility class. Used for main view and thumbnail view.
    */
   var DocumentView = function(elId, config) {
      this.id = elId;
      this.config = config || {};
      this.pages = [];
      this.viewer = Dom.get(elId);
      this.viewerRegion = Dom.getRegion(this.viewer);
      this.currentScale = config.currentScale || K_UNKNOWN_SCALE;
   }
   
   DocumentView.prototype =
   {
      /**
       * Currently active page
       * 
       * @property activePage
       */
      activePage: null,

      /**
       * Add a single page from a PDF document to this view
       * 
       * @method addPage
       */
      addPage: function DocumentView_addPage(id, content)
      {
         var page = new DocumentPage(id, content, this, {});
         this.pages.push(page);
      },
      
      /**
       * Add pages from a PDF document to this view
       * 
       * @method addPages
       */
      addPages: function DocumentView_addPages(pages)
      {
         for (var i = 0; i < pages.length; i++)
         {
            var page = pages[i];
            this.addPage(i + 1, page);
         }
      },
      
      /**
       * Render page containers and set their sizes. This does not render the page content itself, neither canvas or text layers.
       * 
       * @method render
       */
      render: function DocumentView_render()
      {
         // Render each page (not canvas or text layers)
         for (var i = 0; i < this.pages.length; i++)
         {
            this.pages[i].render();
         }
         
         // Set scale, if not already set
         if (this.currentScale === K_UNKNOWN_SCALE)
         {
            // Scale was not initialized: invalid bookmark or scale was not specified.
            // Setting the default one.
            this.setScale(this.parseScale(this.config.defaultScale));
         }
         else
         {
            this.alignRows();
         }
      },
      
      /**
       * Remove all existing canvas content
       * 
       * @method reset
       */
      reset: function DocumentView_reset()
      {
         // Remove all the existing canvas elements
         for (var i = 0; i < this.pages.length; i++)
         {
            this.pages[i].reset();
         }
   
         // Now redefine the row margins
         this.alignRows();
      },
      
      /**
       * Centre the rows of pages horizontally  within their parent viewer element by adding the correct amount of left padding
       * 
       * @method alignRows
       */
      alignRows: function DocumentView_alignRows()
      {
         var rowPos = -1, rowWidth = 0, largestRow = 0;
         if (this.config.pageLayout == "multi")
         {
            Dom.setStyle(this.viewer, "padding-left", "0px");
            for (var i = 0; i < this.pages.length; i++)
            {
               var page = this.pages[i], container = page.container, vpos = page.getVPos();
               // If multi-page mode is on, we need to add custom extra margin to the LHS of the 1st item in the row to make it centred
               if (vpos != rowPos)
               {
                  rowWidth = parseInt(Dom.getStyle(container, "margin-left")); // Rather than start from zero assume equal right padding on last row item
               }
               rowWidth += Dom.getRegion(container).width + parseInt(Dom.getStyle(container, "margin-left"));
               largestRow = Math.max(largestRow, rowWidth);
               rowPos = vpos;
            }
            Dom.setStyle(this.viewer, "padding-left", "" + Math.floor(((this.viewer.clientWidth - largestRow) / 2)) + "px");
         }
      },
      
      /**
       * Render pages in the visible area of the viewer (or near it) given the current scroll position
       * 
       * @method renderVisiblePages
       */
      renderVisiblePages: function DocumentView_renderVisiblePages()
      {
         // region may not be populated properly if the div was hidden
         this.viewerRegion = Dom.getRegion(this.viewer);
         
         // Render visible pages
         for (var i = 0; i < this.pages.length; i++)
         {
            var page = this.pages[i];
            if (page.container && !page.canvas && page.getVPos() < this.viewerRegion.height * 1.5 && page.getVPos() > this.viewerRegion.height * -1.5)
            {
               page.renderContent();
            }
         }
      },
      
      /**
       * Scroll the viewer to the given page number
       * 
       * @method scrollTo
       * @param n {int} Number of the page to scroll to, 1 or greater.
       */
      scrollTo: function DocumentView_scrollTo(n)
      {
         var newPos = this.pages[n - 1].getVPos(),
            firstPos = this.pages[0].getVPos();
         
         if (Alfresco.logger.isDebugEnabled())
         {
            Alfresco.logger.debug("Scrolling to page " + n);
            Alfresco.logger.debug("New page top is " + newPos + "px");
            Alfresco.logger.debug("First page top is " + firstPos + "px");
         }
         
         var scrollTop = newPos - firstPos;
   
         if (Alfresco.logger.isDebugEnabled())
         {
            Alfresco.logger.debug("Old scrollTop was " + this.viewer.scrollTop + "px");
            Alfresco.logger.debug("Set scrollTop to " + scrollTop + "px");
         }
         this.viewer.scrollTop = scrollTop;
         this.pageNum = n;
         
         // Render visible pages
         this.renderVisiblePages();
      },
      
      /**
       * Set the scale of the view and remove all previously-rendered document content
       * 
       * @method setScale
       * @param value {float} numerical scale value
       */
      setScale: function DocumentView_setScale(value)
      {
         if (value == this.currentScale)
         {
            return;
         }
         this.currentScale = value;
         
         // Remove all the existing canvas elements
         this.reset();
   
         // Now redefine the row margins
         this.alignRows();
      },
      
      /**
       * Calculate page zoom level based on the supplied value. Recognises numerical values and special string constants, e.g. 'page-fit'.
       * Normally used in conjunction with setScale(), since this method does not set the current value.
       * 
       * @method parseScale
       * @private
       * @return {float} Numerical scale value
       */
      parseScale: function DocumentView_parseScale(value)
      {
         var scale = parseFloat(value);
         if (scale)
         {
            return scale;
         }
   
         if (this.pages.length > 0)
         {
             var currentPage = this.pages[0],
                container = currentPage.container,
                hmargin = parseInt(Dom.getStyle(container, "margin-left")) + parseInt(Dom.getStyle(container, "margin-right")),
                vmargin = parseInt(Dom.getStyle(container, "margin-top")) + parseInt(Dom.getStyle(container, "margin-bottom")),
                contentWidth = parseInt(currentPage.content.pageInfo.view[2]),
                contentHeight = parseInt(currentPage.content.pageInfo.view[3]),
                clientWidth = this.viewer.clientWidth - 1, // allow an extra pixel in width otherwise 2-up view wraps
                clientHeight = this.viewer.clientHeight;
             
             if ('page-width' == value)
             {
                var pageWidthScale = (clientWidth - hmargin*2) / contentWidth;
                return pageWidthScale;
             }
             else if ('two-page-width' == value)
             {
                var pageWidthScale = (clientWidth - hmargin*3) / contentWidth;
                return pageWidthScale / 2;
             }
             else if ('page-height' == value)
             {
                var pageHeightScale = (clientHeight - vmargin*2) / contentHeight;
                return pageHeightScale;
             }
             else if ('page-fit' == value)
             {
                var pageWidthScale = (clientWidth - hmargin*2) / contentWidth,
                   pageHeightScale = (clientHeight - vmargin*2) / contentHeight;
                return Math.min(pageWidthScale, pageHeightScale);
             }
             else if ('two-page-fit' == value)
             {
                var pageWidthScale = (clientWidth - hmargin*3) / contentWidth,
                   pageHeightScale = (clientHeight - vmargin*2) / contentHeight;
                return Math.min(pageWidthScale / 2, pageHeightScale);
             }
             else if ('auto' == value)
             {
                var tpf = this.parseScale("two-page-fit"),
                   opf = this.parseScale("page-fit"),
                   opw = this.parseScale("page-width"),
                   tpw = this.parseScale("two-page-width"),
                   minScale = this.config.autoMinScale;
                if (tpf > minScale)
                {
                   return tpf;
                }
                else if (opf > minScale)
                {
                   return opf;
                }
                else if (tpw > minScale)
                {
                   return tpw;
                }
                else if (opw > minScale)
                {
                   return opw;
                }
                else
                {
                   return minScale;
                }
             }
             else
             {
                throw "Unrecognised zoom level '" + value + "'";
             }
          }
          else
          {
             throw "Unrecognised zoom level - no pages";
          }
      },
      
      /**
       * Return the number of the page (1 or greater) that should be considered the 'current' page given the scroll position.
       * 
       * @method getScrolledPageNumber
       * @returns {int} Number of the current page, 1 or greater
       */
      getScrolledPageNumber: function DocumentView_getScrolledPageNumber()
      {
         // Calculate new page number
         for (var i = 0; i < this.pages.length; i++)
         {
            var page = this.pages[i],
               vpos = page.getVPos();
            if (vpos + parseInt(page.container.style.height) / 2 > 0)
            {
               return i + 1;
            }
         }
         return this.pages.length;
      },
      
      /**
       * Set the currently-active page number
       * 
       * @method setActivePage
       */
      setActivePage: function DocumentView_setActivePage(n)
      {
         if (this.activePage)
         {
            Dom.removeClass(this.activePage.container, "activePage");
         }
         Dom.addClass(this.pages[n-1].container, "activePage");
         this.activePage = this.pages[n-1];
      }
   }
   
   /**
    * Text layer builder, used to render text layer into pages. Copied from pdf.js viewer.
    */
   var TextLayerBuilder = function textLayerBuilder(textLayerDiv) {
      this.textLayerDiv = textLayerDiv;
   
      this.beginLayout = function textLayerBuilderBeginLayout() {
        this.textDivs = [];
        this.textLayerQueue = [];
      };
   
      this.endLayout = function textLayerBuilderEndLayout() {
        var self = this;
        var textDivs = this.textDivs;
        var textLayerDiv = this.textLayerDiv;
        var renderTimer = null;
        var renderingDone = false;
        var renderInterval = 0;
        var resumeInterval = 500; // in ms
   
        // Render the text layer, one div at a time
        function renderTextLayer() {
          if (textDivs.length === 0) {
            clearInterval(renderTimer);
            renderingDone = true;
            return;
          }
          var textDiv = textDivs.shift();
          if (textDiv.dataset.textLength > 0) {
            textLayerDiv.appendChild(textDiv);
   
            if (textDiv.dataset.textLength > 1) { // avoid div by zero
              // Adjust div width to match canvas text
              // Due to the .offsetWidth calls, this is slow
              // This needs to come after appending to the DOM
              var textScale = textDiv.dataset.canvasWidth / textDiv.offsetWidth;
              Dom.setStyle(textDiv, 'transform', 'scale(' + textScale + ', 1)');
              Dom.setStyle(textDiv, 'transformOrigin', '0% 0%');
            }
          } // textLength > 0
        }
        renderTimer = setInterval(renderTextLayer, renderInterval);
   
        // Stop rendering when user scrolls. Resume after XXX milliseconds
        // of no scroll events
        var scrollTimer = null;
        function textLayerOnScroll() {
          if (renderingDone) {
            window.removeEventListener('scroll', textLayerOnScroll, false);
            return;
          }
   
          // Immediately pause rendering
          clearInterval(renderTimer);
   
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(function textLayerScrollTimer() {
            // Resume rendering
            renderTimer = setInterval(renderTextLayer, renderInterval);
          }, resumeInterval);
        }; // textLayerOnScroll
   
        window.addEventListener('scroll', textLayerOnScroll, false);
      }; // endLayout
   
      this.appendText = function textLayerBuilderAppendText(text,
                                                            fontName, fontSize) {
        var textDiv = document.createElement('div');
   
        // vScale and hScale already contain the scaling to pixel units
        var fontHeight = fontSize * text.geom.vScale;
        textDiv.dataset.canvasWidth = text.canvasWidth * text.geom.hScale;
        textDiv.dataset.fontName = fontName;
   
        textDiv.style.fontSize = fontHeight + 'px';
        textDiv.style.left = text.geom.x + 'px';
        textDiv.style.top = (text.geom.y - fontHeight) + 'px';
        textDiv.textContent = PDFJS.bidi(text, -1);
        textDiv.dir = text.direction;
        textDiv.dataset.textLength = text.length;
        this.textDivs.push(textDiv);
      };
    };
})();