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
      Alfresco.dashlet.VideoWidget.superclass.constructor.call(this, "Alfresco.dashlet.VideoWidget", htmlId, ["button", "container", "datatable", "datasource", "treeview"]);
      
      // Initialise prototype properties
      this.configDialog = null;
      
      // Decoupled event listeners
      if (htmlId != "null")
      {
         YAHOO.Bubbling.on("renderCurrentValue", this.onDocumentsSelected, this);
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
         site: ""
      },
      
      /**
       * Configuration dialog instance
       *
       * @property configDialog
       * @type object
       */
      configDialog: null,
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function VideoWidget_onReady()
      {
         // Cache widget refs
         this.widgets.pathField = Dom.get(parent.id + "-pathField"); 
         this.widgets.nodeField = Dom.get(parent.id + "-nodeRef");
         
         // Add click handler to config feed link that will be visible if user is site manager.
         var configVideoLink = Dom.get(this.id + "-configVideo-link");
         if (configVideoLink)
         {
            Event.addListener(configVideoLink, "click", this.onConfigVideoClick, this, true);            
         }
         
         if (this.options.nodeRef != null && this.options.nodeRef != "")
         {
            Dom.get(this.id + "-preview").style.display = "block";
            
            // Unfortunately this seems to render the Flash movie below the shadow div
            /*
            new Alfresco.VideoPreview(this.id + "-preview").setOptions(
            {
               nodeRef: this.options.nodeRef,
               name: "",
               icon: "",
               mimeType: this.options.mimeType,
               previews: this.options.previews,
               availablePreviews: this.options.availablePreviews,
               size: this.options.size
            }).setMessages(
                  Alfresco.messages.scope[this.name]
             );
            */
         }
         else
         {
            Dom.get(this.id + "-msg").innerHTML = this.msg("message.noVideo");
            Dom.get(this.id + "-msg").style.display = "block";
         }
      },

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
               width: "50em",
               templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/video/config", actionUrl: actionUrl,
               site: this.options.site,
               onSuccess:
               {
                  fn: function VideoWidget_onConfigFeed_callback(response)
                  {
                      if (this.widgets.picker && this.widgets.picker.options.currentValue)
                	  {
                          Dom.get(this.configDialog.id + "-nodeRef").value = 
                              this.widgets.picker.options.currentValue;
                	  }
                  },
                  scope: this
               },
               doSetupFormsValidation:
               {
                  fn: function VideoWidget_doSetupForm_callback(form)
                  {
                     Dom.get(this.configDialog.id + "-nodeRef").value = this.options.nodeRef;
                     Dom.get(this.configDialog.id + "-video").innerHTML = this.options.name;
                     
                     // Set up file picker
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
          if ($hasEventInterest(this.widgets.picker, args))
          {
              var obj = args[1];
              if (obj !== null)
              {
                  var items = this.widgets.picker.currentValueMeta;
                  if (items && items.length == 1)
                  {
                      this.options.nodeRef = items[0].nodeRef;
                      this.options.name = items[0].name;

                      Dom.get(this.configDialog.id + "-nodeRef").value = this.options.nodeRef;
                      Dom.get(this.configDialog.id + "-video").innerHTML = this.options.name;
                  }
              }
          }
      }
   });

})();