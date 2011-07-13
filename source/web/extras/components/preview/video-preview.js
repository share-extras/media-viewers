/**
 * VideoPreview component. 
 *
 * @namespace Alfresco
 * @class Alfresco.VideoPreview
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
    * VideoPreview constructor.
    *
    * @param {string} htmlId The HTML id of the parent element
    * @return {Alfresco.VideoPreview} The new VideoPreview instance
    * @constructor
    * @private
    */
   Alfresco.VideoPreview = function(containerId)
   {
      Alfresco.VideoPreview.superclass.constructor.call(this, "Alfresco.VideoPreview", containerId, ["button", "container", "datatable", "datasource", "uploader"]);

      /* Decoupled event listeners are added in setOptions */
      YAHOO.Bubbling.on("documentDetailsAvailable", this.onDocumentDetailsAvailable, this);
      YAHOO.Bubbling.on("recalculatePreviewLayout", this.onRecalculatePreviewLayout, this);

      return this;
   };

   YAHOO.extend(Alfresco.VideoPreview, Alfresco.component.Base,
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
       * A list of previews available for this component
       *
       * @property previews
       * @type Array
       * @default null
       */
      previews: null,

      /**
       * A list of previews which have already been generated for this component
       *
       * @property generatedPreviews
       * @type Array
       * @default null
       */
      availablePreviews: null,

      /**
       * Fired by YUILoaderHelper when required component script files have
       * been loaded into the browser.
       *
       * @method onComponentsLoaded
       */
      onComponentsLoaded: function WP_onComponentsLoaded()
      {
         /**
          * SWFObject patch
          * Ensures all flashvars are URI encoded
          */
         YAHOO.deconcept.SWFObject.prototype.getVariablePairs = function()
         {
             var variablePairs = [],
                key,
                variables = this.getVariables();
             
             for (key in variables)
             {
                if (variables.hasOwnProperty(key))
                {
                   variablePairs[variablePairs.length] = key + "=" + encodeURIComponent(variables[key]);
                }
             }
             return variablePairs;
          };
         
         Event.onContentReady(this.id, this.onReady, this, true);
      },

      /**
       * Fired by YUI when parent element is available for scripting
       *
       * @method onReady
       */
      onReady: function VP_onReady()
      {
          // Save a reference to the HTMLElement displaying texts so we can alter the texts later
          this.widgets.swfPlayerMessage = Dom.get(this.id + "-swfPlayerMessage-div");
          this.widgets.titleText = Dom.get(this.id + "-title-span");
          this.widgets.titleImg = Dom.get(this.id + "-title-img");
          
          if (this.options.nodeRef != "")
          {
              this._load();
          }
      },
      
      /**
       * Load video metadata
       * 
       * @method _load
       * @private
       */
      _load: function VP__load()
      {
          // Load thumbnail definitions
          Alfresco.util.Ajax.jsonGet(
          {
             url: Alfresco.constants.PROXY_URI + "api/node/" + this.options.nodeRef.replace(":/", "") + "/content/thumbnaildefinitions",
             successCallback:
             {
                fn: function VP_onLoadThumbnailDefinitions(p_resp, p_obj)
                {
                    this.previews = p_resp.json;

                    // Load available thumbnail definitions, i.e. which thumbnails have been generated already
                    Alfresco.util.Ajax.jsonGet(
                    {
                       url: Alfresco.constants.PROXY_URI + "api/node/" + this.options.nodeRef.replace(":/", "") + "/content/thumbnails",
                       successCallback:
                       {
                          fn: function VP_onLoadThumbnails(p_resp, p_obj)
                          {
                              var thumbnails = [];
                              for (var i = 0; i < p_resp.json.length; i++)
                              {
                                  thumbnails.push(p_resp.json[i].thumbnailName);
                              }
                              this.availablePreviews = thumbnails;
                              this._setupVideoPreview(false);
                          },
                          scope: this,
                          obj:
                          {
                          }
                       },
                       failureMessage: "Could not load thumbnails list"
                    });
                },
                scope: this,
                obj:
                {
                }
             },
             failureMessage: "Could not load thumbnail definitions list"
          });
          
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
            this._load();
         }
      },

      /**
       * Because the VideoPreview content is absolutely positioned, components which alter DOM layout can fire
       * this event to prompt a recalculation of the absolute coordinates.
       *
       * @method onRecalculatePreviewLayout
       * @param p_layer The type of the event
       * @param p_args Event information
       */
      onRecalculatePreviewLayout: function WP_onRecalculatePreviewLayout(p_layer, p_args)
      {
         // Only if not in maximize view
         this._positionOver(this.widgets.realSwfDivEl, this.widgets.shadowSfwDivEl);
      },

      /**
       * Set up the Flash video preview
       *
       * @method _setupVideoPreview
       * @private
       */
      _setupVideoPreview: function WP__setupVideoPreview()
      {
         if (this.previews === null || this.availablePreviews === null)
         {
            return;
         }
         
         // Set 'Preparing Previewer message'
         this.widgets.swfPlayerMessage.innerHTML = this.msg("label.preparingPreviewer")

         // Set preview area title and icon         
         if (this.widgets.titleText)
         {
            this.widgets.titleText.innerHTML = this.options.name;
         }
         if (this.widgets.titleImg)
         {
            this.widgets.titleImg.src = Alfresco.constants.URL_CONTEXT + this.options.icon.substring(1);
         }

         // Parameter nodeRef is mandatory
         if (this.options.nodeRef === undefined)
         {
             throw new Error("A nodeRef must be provided");
         }

         /**
          * To support full window mode an extra div (realSwfDivEl) is created with absolute positioning
          * which will have the same position and dimensions as shadowSfwDivEl.
          * The realSwfDivEl element is to make sure the flash move is on top of all other divs and
          * the shadowSfwDivEl element is to make sure the previewer takes the screen real estate it needs.
          */
         if (!this.widgets.realSwfDivEl)
         {
            var realSwfDivEl = new Element(document.createElement("div"));
            realSwfDivEl.set("id", this.id + "-real-swf-div");
            realSwfDivEl.setStyle("position", "absolute");
            realSwfDivEl.addClass("video-preview");
            realSwfDivEl.addClass("real");
            realSwfDivEl.appendTo(document.body);
            this.widgets.realSwfDivEl = realSwfDivEl;
         }
         this.widgets.shadowSfwDivEl = new Element(this.id + "-shadow-swf-div");

         if (this.options.size == "0")
         {
            // Shrink the web previewers real estate and tell user that node has no content
            this.widgets.shadowSfwDivEl.removeClass("has-content");
            this.widgets.realSwfDivEl.addClass("no-content");
            this.widgets.swfPlayerMessage.innerHTML = this.msg("label.noContent");
         }
         else if (Alfresco.util.hasRequiredFlashPlayer(6, 0, 0))
         {
            // Find the url to the preview
            var previewCtx = this._resolvePreview();
            if (previewCtx)
            {
               if (previewCtx.videourl)
               {
                  // Make sure the web previewers real estate is big enough for displaying something
                  this.widgets.shadowSfwDivEl.addClass("has-content");
                  this.widgets.realSwfDivEl.removeClass("no-content");
                  
                  var region = Dom.getRegion(this.widgets.shadowSfwDivEl.get("id")),
                     swfId = "VideoPreviewer_" + this.id,
                     argsNoCache = (YAHOO.env.ua.ie > 0) ? "?noCacheToken=" + new Date().getTime() : "",
                     so = new YAHOO.deconcept.SWFObject(Alfresco.constants.URL_CONTEXT + "res/extras/components/preview/player_flv_maxi.swf" + argsNoCache,
                        swfId, "100%", "100%", "6.0.0");
                  
                  so.addVariable("fileName", this.options.name);
                  so.addVariable("flv", previewCtx.videourl);
                  if (previewCtx.imageurl != null)
                  {
                     so.addVariable("startimage", previewCtx.imageurl);
                  }
                  so.addVariable("showfullscreen", 1);
                  so.addVariable("showiconplay", 1);
                  so.addVariable("showplayer", "always");
                  so.addVariable("showvolume", 1);
                  so.addVariable("showtime", 1);
                  so.addVariable("playercolor", "e1e3e5");
                  so.addVariable("margin", "0");
                  so.addVariable("buttoncolor", "000000");
                  so.addVariable("buttonovercolor", "0088de");
                  so.addVariable("sliderovercolor", "0088de");
                  so.addParam("allowScriptAccess", "sameDomain");
                  so.addParam("allowFullScreen", "true");
                  so.addParam("quality", "autohigh");
                  so.addParam("wmode", "transparent");
   
                  // Finally create (or recreate) the flash web preview in the new div
                  this.widgets.swfPlayerMessage.innerHTML = "";
                  so.write(this.widgets.realSwfDivEl.get("id"));
                  this.widgets.swfObject = so;
   
                  /**
                   * FF3 and SF4 hides the browser cursor if the flashmovie uses a custom cursor
                   * when the flash movie is placed/hidden under a div (which is what happens if a dialog
                   * is placed on top of the web previewer) so we must turn off custom cursor
                   * when the html environment tells us to.
                   */
                  Event.addListener(swfId, "mouseover", function(e)
                  {
                     var swf = Dom.get(swfId);
                     if (swf && YAHOO.lang.isFunction(swf.setMode))
                     {
                        Dom.get(swfId).setMode("active");
                     }
                  });
                  Event.addListener(swfId, "mouseout", function(e)
                  {
                     var swf = Dom.get(swfId);
                     if (swf && YAHOO.lang.isFunction(swf.setMode))
                     {
                        Dom.get(swfId).setMode("inactive");
                     }
                  });
   
                  // Page unload / unsaved changes behaviour
                  Event.addListener(window, "resize", function(e)
                  {
                     YAHOO.Bubbling.fire("recalculatePreviewLayout");
                  });
               }
               else
               {
                  // Video rendition is not yet ready, or could not be generated
                  // TODO Fire off a request to queue the rendition generation
                  this._queueVideoThumbnailGeneration();
                  
                  // Shrink the web previewers real estate and tell user that the node has nothing to display
                  this.widgets.shadowSfwDivEl.removeClass("has-content");
                  this.widgets.realSwfDivEl.addClass("no-content");
                  var url = Alfresco.constants.PROXY_URI + "api/node/content/" + this.options.nodeRef.replace(":/", "") + "/" + encodeURIComponent(this.options.name) + "?a=true";
                  this.widgets.swfPlayerMessage.innerHTML = this.msg("label.noVideoAvailable", url);
                  //this.widgets.swfPlayerMessage.style.backgroundImage = "url('" + previewCtx.imageurl + "')";
                  //this.widgets.swfPlayerMessage.style.height = "200px";
               }
            }
            else
            {
               // Shrink the web previewers real estate and tell user that the node has nothing to display
               this.widgets.shadowSfwDivEl.removeClass("has-content");
               this.widgets.realSwfDivEl.addClass("no-content");
               var url = Alfresco.constants.PROXY_URI + "api/node/content/" + this.options.nodeRef.replace(":/", "") + "/" + encodeURIComponent(this.options.name) + "?a=true";
               this.widgets.swfPlayerMessage.innerHTML = this.msg("label.noPreview", url);
            }
         }
         else
         {
            // Shrink the web previewers real estate and tell user that no sufficient flash player is installed
            this.widgets.shadowSfwDivEl.removeClass("has-content");
            this.widgets.realSwfDivEl.addClass("no-content");
            this.widgets.swfPlayerMessage.innerHTML = this.msg("label.noFlash");
         }

         // Place the real flash preview div on top of the shadow div
         this._positionOver(this.widgets.realSwfDivEl, this.widgets.shadowSfwDivEl);
      },
      
      /**
       * Return mime types supported by the video previewer for this file
       * 
       * @method _getSupportedVideoMimeTypes
       * @return Array containing the video MIME types supported by the Flash video player for this file, in order of preference
       */
      _getSupportedVideoMimeTypes: function WP__getSupportedVideoMimeTypes()
      {
         var ps = this.previews, 
            flvpreview = "flvpreview", h264preview = "h264preview", 
            flvmimetype = "video/x-flv", h264mimetype = "video/mp4",
            mimetype = this.options.mimeType,
            mimetypes = [];
         
         // Require Flash player 9.0.115 (9 beta 3) for h264 video
         if ((Alfresco.util.arrayContains(ps, h264preview) || mimetype == h264mimetype) && Alfresco.util.hasRequiredFlashPlayer(9, 0, 115))
         {
            mimetypes.push(h264mimetype);
         }
         if ((Alfresco.util.arrayContains(ps, flvpreview) || mimetype == flvmimetype) && Alfresco.util.hasRequiredFlashPlayer(6, 0, 0))
         {
            mimetypes.push(flvmimetype);
         }
         return mimetypes;
      },

      /**
       * Helper method for deciding what previews to use to display the video content plus a still image from the video
       *
       * @method _resolvePreview
       * @return An object with two properties - 'videourl' contains the video content URL to use, 'imageurl' contains the still image URL. Either or both properties may be null if no appropriate thumbnail definitions can be found
       */
      _resolvePreview: function WP__resolvePreview(event)
      {
         var ps = this.previews, videopreview,
            psa = this.availablePreviews, 
            flvpreview = "flvpreview", h264preview = "h264preview",
            imgpreview = "imgpreview", imgpreviewfull = "imgpreviewfull",
            nodeRefAsLink = this.options.nodeRef.replace(":/", ""),
            videourl, imageurl;

         // Static image to display before the user clicks 'play'
         imageurl = Alfresco.util.arrayContains(ps, imgpreviewfull) ? 
               this._getContentURL(nodeRefAsLink, imgpreviewfull) : 
               (Alfresco.util.arrayContains(ps, imgpreview) ? this._getContentURL(nodeRefAsLink, imgpreview) : null);
         
         var supportedtypes = this._getSupportedVideoMimeTypes();
         
         // Permissively allow the content item itself to be returned if supported - strict compliance would imply we always return the preferred thumbnail format
         if (Alfresco.util.arrayContains(supportedtypes, this.options.mimeType))
         {
            /* The content matches an image mimetype that the player can handle without a preview */
            videourl = this._getContentURL(nodeRefAsLink, null);
            return (
            {
               videourl: videourl,
               imageurl: imageurl
            });
         }
         else
         {
            // Always use the preferred thumbnail format, even if less-preferred formats are available and have been generated already
            videopreview = supportedtypes.length > 0 ? (supportedtypes[0] == "video/mp4" ? h264preview : (supportedtypes[0] == "video/x-flv" ? flvpreview : null)) : null;
            
            if (videopreview !== null) // Can the content can be previewed?
            {
               if (Alfresco.util.arrayContains(psa, videopreview)) // Is a video preview available (i.e already generated)?
               {
                  videourl = this._getContentURL(nodeRefAsLink, videopreview);
               }
               return (
               {
                  videourl: videourl,
                  imageurl: imageurl
               });
            }
            else
            {
           	 return null;
            }
         }
      },
      
      _getContentURL: function WP_getContentURL(nodeRef, thumbnailName)
      {
         var argsNoCache = "?c=force&noCacheToken=" + new Date().getTime();
         return Alfresco.constants.PROXY_URI + "api/node/" + nodeRef.replace("://", "/") + "/content" + (thumbnailName != null ? "/thumbnails/" + thumbnailName : "") + argsNoCache;
      },
      
      /**
       * Fire off a request to the repository to queue the creation of video renditions
       * 
       * @method _queueVideoThumbnailGeneration
       * @return
       */
      _queueVideoThumbnailGeneration: function WP_queueVideoThumbnailGeneration ()
      {
         var ps = this.previews, videopreview,
         flvpreview = "flvpreview", h264preview = "h264preview";
         
         videopreview = Alfresco.util.arrayContains(ps, h264preview) ? h264preview : (Alfresco.util.arrayContains(ps, flvpreview) ? flvpreview : null);
         
         if (videopreview !== null)
         {
            var actionUrl = YAHOO.lang.substitute(Alfresco.constants.PROXY_URI + "api/node/{nodeRef}/content/thumbnails/{thumbnailname}?c=queue",
            {
               nodeRef: this.options.nodeRef.replace(":/", ""),
               thumbnailname: videopreview
            });
            
            Alfresco.util.Ajax.request(
            {
               method: Alfresco.util.Ajax.GET,
               url: actionUrl,
               successCallback:
               {
                  fn: function WP_onQueueVideoThumbnailSuccess(event, obj)
                  { // Do nothing
                  },
                  scope: this,
                  obj:
                  {
                  }
               },
               failureCallback:
               {
                  fn: function WP_onQueueVideoThumbnailFailure(event, obj)
                  { // Do nothing
                  },
                  scope: this,
                  obj:
                  {
                  }
               }
            });
         }
      },

      /**
       * Positions the one element over another
       *
       * @method _positionOver
       * @param event
       */
      _positionOver: function WP__positionOver(positionedYuiEl, sourceYuiEl)
      {
         var region = Dom.getRegion(sourceYuiEl.get("id"));
         positionedYuiEl.setStyle("left", region.left + "px");
         positionedYuiEl.setStyle("top", region.top + "px");
         positionedYuiEl.setStyle("width", region.width + "px");
         positionedYuiEl.setStyle("height", region.height + "px");
      }
   });
})();