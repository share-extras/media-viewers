/**
 * Alfresco.dashlet.VideoWidget
 *
 * Displays a user-selected video file on a user's dashboard
 *
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
    var $html = Alfresco.util.encodeHTML,
       $combine = Alfresco.util.combinePaths,
       $hasEventInterest = Alfresco.util.hasEventInterest;

   /**
    * VideoWidget constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.VideoWidget} The new VideoWidget instance
    * @constructor
    */
   Alfresco.dashlet.VideoWidget = function(htmlId)
   {
      Alfresco.dashlet.VideoWidget.superclass.constructor.call(this, "Alfresco.dashlet.VideoWidget", htmlId, ["button", "container", "datatable", "datasource", "uploader"]);
      
      // Initialise prototype properties
      this.configDialog = null;
      
      // Decoupled event listeners
      if (htmlId != "null")
      {
         YAHOO.Bubbling.on("onDocumentsSelected", this.onDocumentsSelected, this);
      }
      
      return this;
   };

   YAHOO.extend(Alfresco.dashlet.VideoWidget, Alfresco.component.Base,
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
          * The component id
          *
          * @property componentId
          * @type string
          * @default ""
          */
         componentId: "",

         /**
          * The nodeRef to the video to display
          *
          * @property nodeRef
          * @type string
          * @default ""
          */
         nodeRef: "",

         /**
          * The name of the configured content item
          *
          * @property name
          * @type string
          * @default ""
          */
         name: "",

         /**
          * The title property of the configured content item
          *
          * @property title
          * @type string
          * @default ""
          */
         title: "",

         /**
          * The siteId of the current site
          *
          * @property site
          * @type string
          * @default ""
          */
         siteId: ""
      },
      
      /**
       * Configuration dialog instance
       *
       * @property configDialog
       * @type object
       */
      configDialog: null,
      
      /**
       * Dashlet title Dom element
       *
       * @property titleEl
       * @type HTMLElement
       */
      titleEl: null,
      
      /**
       * Dashlet message area Dom element
       *
       * @property messageEl
       * @type HTMLElement
       */
      messageEl: null,
      
      /**
       * Dashlet preview area Dom element
       *
       * @property previewEl
       * @type HTMLElement
       */
      previewEl: null,
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function VideoWidget_onReady()
      {
         // Cache frequently used Dom elements
         this.titleEl = Dom.get(this.id + "-title");
         this.messageEl = Dom.get(this.id + "-msg");
         this.previewEl = Dom.get(this.id + "-preview");
         
         // Set up the title
         this._setupTitle();
         
         // Set up the message area
         this._setupMessage();
         
         // Set up the preview area with default parameters (i.e. do not load data)
         this._setupPreview();
      },
      
      /**
       * Set up the dashlet title
       *
       * @method _setupTitle
       */
      _setupTitle: function VideoWidget__setupTitle()
      {
          if (this.options.nodeRef != "" && this.options.name != "")
          {
              this.titleEl.innerHTML = "<a href=\"" + Alfresco.constants.URL_PAGECONTEXT + 
                  "site/" + this.options.siteId + "/document-details?nodeRef=" + this.options.nodeRef + "\">" +
                  this.options.name + "</a>";
          }
          else
          {
              this.titleEl.innerHTML = this.msg("header.video");
          }
      },
      
      /**
       * Set up the dashlet message area
       *
       * @method _setupMessage
       */
      _setupMessage: function VideoWidget__setupMessage()
      {
          if (this.options.nodeRef != null && this.options.nodeRef != "")
          {
              Dom.setStyle(this.messageEl, "display", "none");
          }
          else
          {
             this.messageEl.innerHTML = this.msg("message.noVideo");
             Dom.setStyle(this.messageEl, "display", "block");
          }
      },
      
      /**
       * Set up the dashlet preview area
       *
       * @method _setupPreview
       * @private
       */
      _setupPreview: function VideoWidget__setupPreview()
      {
          // Attempt to match the WebPreview overlay div with Flash content and remove it, before reloading the preview
          // This is very hacky. The Alfresco.WebPreview should really have a destroy() method to take care of this, but it does not override the base definition from Alfresco.component.Base.
          var swfDiv = Dom.get(this.id + "-preview_x002e_dashlet-document-preview_x0023_default-full-window-div");
          if (swfDiv)
          {
              var p = swfDiv.parentNode;
              p.removeChild(swfDiv);
          }
         
          if (this.options.nodeRef != null && this.options.nodeRef != "")
          {
              Dom.setStyle(this.previewEl, "display", "block");
              
              var elId = Dom.getAttribute(this.previewEl, "id");

              // Load the web-previewer mark-up using the custom page definition, which just includes that component
              Alfresco.util.Ajax.request(
              {
                 url: Alfresco.constants.URL_PAGECONTEXT + "site/" + this.options.siteId + "/dashlet-document-preview",
                 dataObj: {
                    nodeRef: this.options.nodeRef
                 },
                 successCallback:
                 {
                    fn: function VideoWidget__createFromHTML_success(p_response, p_obj)
                    {
                       var phtml = p_response.serverResponse.responseText.replace(/template_x002e_web-preview/g, p_response.config.object.elId),
                          result = Alfresco.util.Ajax.sanitizeMarkup(phtml);
                       // Following code borrowed from Alfresco.util.Ajax._successHandler
                       // Use setTimeout to execute the script. Note scope will always be "window"
                       var scripts = result[1];
                       if (YAHOO.lang.trim(scripts).length > 0)
                       {
                          window.setTimeout(scripts, 0);
                          // Delay-call the PostExec function to continue response processing after the setTimeout above
                          YAHOO.lang.later(0, this, function() {
                             Alfresco.util.YUILoaderHelper.loadComponents();
                          }, p_response.serverResponse);
                       }
                       p_response.config.object.previewEl.innerHTML = result[0];
                    },
                    scope: this
                 },
                 // Unfortunately we cannot set execScripts to true, as we need to first update the element ids in the html to make them unique, before the scripts are run
                 // So instead we execute the scripts manually, above
                 //execScripts: true,
                 failureMessage: "Failed to load document details for " + this.options.nodeRef,
                 scope: this,
                 object: {
                    elId: elId,
                    previewEl: this.previewEl
                 },
                 noReloadOnAuthFailure: true
              });
          }
          else
          {
             Dom.setStyle(this.previewEl, "display", "none");
          }
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Called when the user clicks the configure video link.
       * Will open a video config dialog
       *
       * @method onConfigFeedClick
       * @param e The click event
       */
      onConfigVideoClick: function VideoWidget_onConfigVideoClick(e)
      {
         var actionUrl = Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId);
         
         Event.stopEvent(e);
         
         if (!this.configDialog)
         {
            this.configDialog = new Alfresco.module.SimpleDialog(this.id + "-configDialog").setOptions(
            {
               templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "extras/modules/video/config", actionUrl: actionUrl,
               siteId: this.options.siteId,
               onSuccess:
               {
                  fn: function VideoWidget_onConfigFeed_callback(response)
                  {
                      // Update options from the submitted form fields
                      this.options.nodeRef = Dom.get(this.configDialog.id + "-nodeRef").value;
                      this.options.name = Dom.get(this.configDialog.id + "-video").innerHTML;
                          
                      // Update dashlet title and message area
                      this._setupTitle();
                      this._setupMessage();

                      /*
                       * Since we only have limited data on the node from the picker (e.g. mimetype
                       * and size are missing), we need to retrieve this via XHR. We then notify the
                       * previewer and it does the rest.
                       */
                      this._setupPreview();
                  },
                  scope: this
               },
               doSetupFormsValidation:
               {
                  fn: function VideoWidget_doSetupForm_callback(form)
                  {
                     Dom.get(this.configDialog.id + "-nodeRef").value = this.options.nodeRef;
                     Dom.get(this.configDialog.id + "-video").innerHTML = this.options.name;
                     
                     // Construct a new document picker... we need to know the nodeRef of the document library
                     // of the site that we are viewing. Make an async request to retrieve this information
                     // using the the siteId and when the call returns, construct a new DocumentPicker using the
                     // DocLib nodeRef as the starting point for document selection...
                     var getDocLibNodeRefUrl = Alfresco.constants.PROXY_URI + "slingshot/doclib/container/" + this.options.siteId + "/documentlibrary";
                     Alfresco.util.Ajax.jsonGet(
                     {
                        url: getDocLibNodeRefUrl,
                        successCallback:
                        {
                           fn: function(response)
                           {
                              var nodeRef = response.json.container.nodeRef;
                              this.widgets.picker = new Alfresco.module.DocumentPicker(this.configDialog.id + "-filePicker", Alfresco.ObjectRenderer);
                              this.widgets.picker.setOptions(
                              {
                                 displayMode: "items",
                                 itemFamily: "node",
                                 itemType: "cm:content",
                                 multipleSelectMode: false,
                                 mandatory: true,
                                 parentNodeRef: nodeRef,
                                 restrictParentNavigationToDocLib: true
                              });
                              this.widgets.picker.onComponentsLoaded(); // Need to force the component loaded call to ensure setup gets completed.
                           },
                           scope: this
                        }
                     });
                     
                     // Set up file picker
                     /*
                     if (!this.widgets.picker)
                     {
                        this.widgets.picker = new Alfresco.module.DocumentPicker(this.configDialog.id + "-filePicker");
                     }
                     this.widgets.picker.setOptions(
                     {
                        currentValue: this.options.nodeRef,
                        itemFamily: "node",
                        multipleSelectMode: false,
                        mandatory: true
                     });
                     */
                  },
                  scope: this
               }
            });
         }
         else
         {
            this.configDialog.setOptions(
            {
               actionUrl: actionUrl
            });
         }
         this.configDialog.show();
      },
 
      /**
       * Files selected in document picker
       * 
       * @method onDocumentsSelected
       * @param layer
       *            {object} Event fired
       * @param args
       *            {array} Event parameters (depends on event type)
       */
      onDocumentsSelected: function VideoWidget_onDocumentsSelected(layer, args)
      {
          // Check the event is directed towards this instance
          //if ($hasEventInterest(this.widgets.picker, args))
          if (args && args[1].items)
          {
              var obj = args[1];
              //var items = this.widgets.picker.currentValueMeta;
              var items = obj.items;
              if (items && items.length == 1)
              {
                  // Check value has changed, if so then update the form
                  if (this.options.nodeRef != items[0].nodeRef)
                  {
                      Dom.get(this.configDialog.id + "-nodeRef").value = items[0].nodeRef;
                      Dom.get(this.configDialog.id + "-video").innerHTML = items[0].name;
                      Dom.get(this.configDialog.id + "-name").value = items[0].name;
                  }
              }

              // Clear the selections...
              this.widgets.picker.resetSelection();
          }
      },

      /**
       * Dashlet resizing completed
       * 
       * @method onEndResize
       * @param height
       *            {int} New height of the dashlet body in pixels
       */
      onEndResize: function VideoWidget_onEndResize(height)
      {
         // Re-load preview area
         this._setupPreview();
      }
   });

})();