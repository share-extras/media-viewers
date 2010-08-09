/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

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
         mimeType: "",

         /**
          * A list of previews available for this component
          *
          * @property previews
          * @type Array
          */
         previews: [],

         /**
          * A list of previews which have already been generated for this component
          *
          * @property generatedPreviews
          * @type Array
          */
         availablePreviews: []
      },

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
      onReady: function WP_onReady()
      {
         // Setup web preview
         this._setupVideoPreview(false);
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
            this._setupVideoPreview();
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
         if (this.widgets.realSwfDivEl.getStyle("height") !== "100%")
         {
            this._positionOver(this.widgets.realSwfDivEl, this.widgets.shadowSfwDivEl);
         }
      },

      /**
       * Will setup the
       *
       * @method _setupVideoPreview
       * @private
       */
      _setupVideoPreview: function WP__setupVideoPreview()
      {
         // Save a reference to the HTMLElement displaying texts so we can alter the texts later
         this.widgets.swfPlayerMessage = Dom.get(this.id + "-swfPlayerMessage-div");
         this.widgets.titleText = Dom.get(this.id + "-title-span");
         this.widgets.titleImg = Dom.get(this.id + "-title-img");

         // Set title and icon         
         this.widgets.titleText.innerHTML = this.options.name;
         this.widgets.titleImg.src = Alfresco.constants.URL_CONTEXT + this.options.icon.substring(1);

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
            realSwfDivEl.addClass("web-preview");
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
   
                  // Create flash web preview by using swfobject
                  var swfId = "VideoPreviewer_" + this.id;
                  var so = new YAHOO.deconcept.SWFObject(Alfresco.constants.URL_CONTEXT + "components/preview/player_flv_maxi.swf",
                        swfId, "100%", "100%", "6.0.0");
                  so.addVariable("fileName", this.options.name);
                  so.addVariable("flv", previewCtx.videourl);
                  so.addVariable("title", this.msg("preview.preparingVideo"));
                  so.addVariable("startimage", previewCtx.imageurl);
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
                  //so.addVariable("showtitleandstartimage", 1);
                  //so.addVariable("width", "480");
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
         var ps = this.options.previews, 
            flvpreview = "flvpreview", h264preview = "h264preview", 
            flvmimetype = "video/x-flv", h264mimetype = "video/mp4",
            mimetype = this.options.mimeType,
            mimetypes = [];
         
         // Require Flash player 9.0.115 (9 beta 3) for h264 video
         if ((Alfresco.util.arrayContains(ps, h264preview) || mimetype == h264mimetype) && Alfresco.util.hasRequiredFlashPlayer(9, 0, 115))
         {
            mimetypes.push(h264mimetype);
         }
         else if ((Alfresco.util.arrayContains(ps, flvpreview) || mimetype == flvmimetype) && Alfresco.util.hasRequiredFlashPlayer(6, 0, 0))
         {
            mimetypes.push(flvmimetype);
         }
         return mimetypes;
      },

      /**
       * Helper method for deciding what preview to use, if any
       *
       * @method _resolvePreview
       * @return the name of the preview to use or null if none is appropriate
       */
      _resolvePreview: function WP__resolvePreview(event)
      {
         var ps = this.options.previews, videopreview,
            psa = this.options.availablePreviews, 
            flvpreview = "flvpreview", h264preview = "h264preview",
            imgpreview = "imgpreviewfull",
            nodeRefAsLink = this.options.nodeRef.replace(":/", ""),
            argsNoCache = "?c=force&noCacheToken=" + new Date().getTime(),
            videourl, imageurl;

         imageurl = Alfresco.constants.PROXY_URI + "api/node/" + nodeRefAsLink + "/content/thumbnails/" + imgpreview + argsNoCache;
         
         var supportedtypes = this._getSupportedVideoMimeTypes();
         
         // Permissively allow the content item itself to be returned if supported - strict compliance would imply we always return the preferred thumbnail format
         if (Alfresco.util.arrayContains(supportedtypes, this.options.mimeType))
         {
            /* The content matches an image mimetype that the player can handle without a preview */
            videourl = Alfresco.constants.PROXY_URI + "api/node/" + nodeRefAsLink + "/content" + argsNoCache;
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
                  videourl = Alfresco.constants.PROXY_URI + "api/node/" + nodeRefAsLink + "/content/thumbnails/" + videopreview + argsNoCache;
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
      
      /**
       * Fire off a request to the repository to queue the creation of video renditions
       * 
       * @method _queueVideoThumbnailGeneration
       * @return
       */
      _queueVideoThumbnailGeneration: function WP_queueVideoThumbnailGeneration ()
      {
         var ps = this.options.previews, videopreview,
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