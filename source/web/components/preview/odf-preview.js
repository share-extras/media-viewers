/**
 * WebODFPreview preview component. 
 *
 * @namespace Alfresco
 * @class Alfresco.WebODFPreviewPreview
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Element = YAHOO.util.Element;

   /**
    * WebODFPreview previewer constructor.
    *
    * @param {string} htmlId The HTML id of the parent element
    * @return {Alfresco.WebODFPreview} The new WebODFPreview instance
    * @constructor
    * @private
    */
   Alfresco.WebODFPreview = function(containerId)
   {
      Alfresco.WebODFPreview.superclass.constructor.call(this, "Alfresco.WebODFPreview", containerId, ["button", "container", "datatable", "datasource", "uploader"]);

      return this;
   };

   YAHOO.extend(Alfresco.WebODFPreview, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * Noderef to the content to display
          *
          * @property nodeRef
          * @type string
          */
         nodeRef: "",

         /**
          * The size of the content
          *
          * @property size
          * @type string
          */
         size: "0",

         /**
          * The file name representing root container
          *
          * @property name
          * @type string
          */
         name: "",

         /**
          * The icon displayed in the header of the component
          *
          * @property icon
          * @type string
          */
         icon: "",

         /**
          * The mimeType of the node to display, needed to decide what preview
          * that should be used.
          *
          * @property mimeType
          * @type string
          */
         mimeType: ""
      },

      /**
       * Fired by YUILoaderHelper when required component script files have
       * been loaded into the browser.
       *
       * @method onComponentsLoaded
       */
      onComponentsLoaded: function WP_onComponentsLoaded()
      {
         Event.onContentReady(this.id, this.onReady, this, true);
      },

      /**
       * Fired by YUI when parent element is available for scripting
       *
       * @method onReady
       */
      onReady: function WP_onReady()
      {
         this.widgets.shadowSfwDivEl = Dom.get(this.id + "-shadow-swf-div");

         var cEl = document.createElement("div");
         Dom.addClass(cEl, "odf-preview-container");
         var pEl = document.createElement("div");
         Dom.setAttribute(pEl, "id", this.id + "-odf-preview");
         Dom.addClass(pEl, "odf-preview-content");
         Dom.addClass(pEl, "real");
         cEl.appendChild(pEl);
         Dom.get(this.id + "-bd").appendChild(cEl);
         
         var me = this;

         this.widgets.odfPreviewEl = pEl;
         this.widgets.odfContainerEl = cEl;
         
         // Save a reference to the HTMLElement displaying text so we can alter the texts later
         this.widgets.swfPlayerMessage = Dom.get(this.id + "-swfPlayerMessage-div");
         this.widgets.titleText = Dom.get(this.id + "-title-span");
         this.widgets.titleImg = Dom.get(this.id + "-title-img");
         
         // Library paths fix
         runtime.libraryPaths = function () {
             return [Alfresco.constants.URL_CONTEXT + "res/modules/webodf/lib"];
         };
         
         // File size detection method fix (API does not allow HEAD against content items)
         runtime.getFileSize = function (path, callback) {
            callback(parseInt(me.options.size, 10));
         }
         
         // Load the ODF canvas
         runtime.loadClass("odf.OdfCanvas");

         // Setup web preview
         this._setupWebODFPreview(false);
      },

      /**
       * Called when document details has been available or changed (if the useDocumentDetailsAvailableEvent
       * option was set to true) on the page so the web previewer can remove its old preview and
       * display a new one if available.
       *
       * @method onDocumentDetailsAvailable
       * @param p_layer The type of the event
       * @param p_args Event information
       */
      onDocumentDetailsAvailable: function WP_onDocumentDetailsAvailable(p_layer, p_args)
      {
         // Get the new info about the node and decide if the previewer must be refreshed
         var documentDetails = p_args[1].documentDetails,
            refresh = false;

         // Name
         if (this.options.name != documentDetails.fileName)
         {
            this.options.name = documentDetails.fileName;
            refresh = true;
         }

         // Mime type
         if (this.options.mimeType != documentDetails.mimetype)
         {
            this.options.mimeType = documentDetails.mimetype;
            refresh = true;
         }

         // Size
         if (this.options.size != documentDetails.size)
         {
            this.options.size = documentDetails.size;
            refresh = true;
         }

         // Setup previewer
         if (refresh)
         {
            this._setupWebODFPreview();
         }
      },
      
      _setupWebODFPreview: function WP__setupWebODFPreview()
      {
         // Make sure the web previewers real estate is big enough for displaying something
         Dom.addClass(this.widgets.shadowSfwDivEl ,"no-content");

         // Set title and icon         
         this.widgets.titleText.innerHTML = this.options.name;
         Dom.setAttribute(this.widgets.titleImg, "src", Alfresco.constants.URL_CONTEXT + this.options.icon.substring(1));
         
         var odfcanvas = new odf.OdfCanvas(this.widgets.odfPreviewEl),
            nodeRefAsLink = this.options.nodeRef.replace(":/", ""),
            argsNoCache = "?c=force&noCacheToken=" + new Date().getTime(),
            location = Alfresco.constants.PROXY_URI + "api/node/" + nodeRefAsLink + "/content" + argsNoCache;
            odfcanvas.load(location);
         
         this.widgets.swfPlayerMessage.innerHTML = "";
      }
   });
})();
