/**
 * Copyright (C) 2010-2011 Share Extras Contributors.
 *
 */

/**
 * This is the "FLVPlayer" plug-in used to display documents directly in the web browser.
 *
 * Supports the "video/x-flv" and "video/mp4" mime types directly, and other video types
 * that can be converted into these formats (e.g. via FFmpeg).
 *
 * TODO Use the same video thumbnail renditions as the base previewers
 *
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.FLVPlayer
 */
(function()
{
    /**
     * FLVPlayer plug-in constructor
     * 
     * TODO Make this generic enough to handle the audio previews as well via a parameter e.g. <plugin previewer="flvplayer" ... />?
     *
     * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
     * @param attributes {Object} Arbitrary attributes brought in from the <plugin> element
     */
    Alfresco.WebPreview.prototype.Plugins.FLVPlayer = function(wp, attributes)
    {
       /* Decoupled event listeners are added in setOptions */
       YAHOO.Bubbling.on("documentDetailsAvailable", this.onDocumentDetailsAvailable, this);
       YAHOO.Bubbling.on("recalculatePreviewLayout", this.onRecalculatePreviewLayout, this);
        
       this.wp = wp;
       this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
       this.swfDiv = null;
       this.previews = this.attributes.poster == null ? [] : [ this.attributes.poster ];
       this.availablePreviews = null;
       return this;
    };
    
    Alfresco.WebPreview.prototype.Plugins.FLVPlayer.prototype =
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
           * @default "100000000"
           */
          srcMaxSize: "100000000",

          /**
           * Decides if flash previewers shall disable the i18n input fix all browsers.
           * If it shall be disabled for certain a certain os/browser override the disableI18nInputFix() method.
           *
           * Fix solves the Flash i18n input keyCode bug when "wmode" is set to "transparent"
           * http://bugs.adobe.com/jira/browse/FP-479
           * http://issues.alfresco.com/jira/browse/ALF-1351
           *
           * ...see "Browser Testing" on this page to see supported browser/language combinations for AS2 version
           * http://analogcode.com/p/JSTextReader/
           *
           * ... We are using the AS3 version of the same fix
           * http://blog.madebypi.co.uk/2009/04/21/transparent-flash-text-entry/
           *
           * @property disableI18nInputFix
           * @type boolean
           */
          disableI18nInputFix: "false"
       },
    
       /**
        * Tests if the plugin can be used in the users browser.
        *
        * @method report
        * @return {String} Returns nothing if the plugin may be used, otherwise returns a message containing the reason
        *         it cant be used as a string.
        * @public
        */
       report: function FLVPlayer_report()
       {
           return this._getSupportedVideoMimeTypes().length > 0 ? "" : "No supported MIME type available";
       },
    
       /**
        * Display the node.
        *
        * @method display
        * @public
        */
       display: function FLVPlayer_display()
       {
          // Make a XHR request to check which thumbnails are actually present on the file (since they usually take some time to generate)
          // Existing Media Previews code should have the ability to do this based on changes made to make previews embeddable in wiki pages
          // If the thumbnail has not been generated then we write out a message to the user saying the thumbnail is being generated, and check
          // back via a timer to display the full preview when it has been.

          // Find the url to the preview
          var previewCtx = this.resolveUrls();

          // TODO Add logic for maximum file size
          /*
          var srcMaxSize = this.attributes.srcMaxSize;
          if (!this.attributes.src && srcMaxSize.match(/^\d+$/) && this.wp.options.size > parseInt(srcMaxSize))
          {
          }
          */
          
          if (previewCtx.videourl) // Present if video is a native mimetype, e.g. mp4
          {
              this._displayPlayer(previewCtx);
          }
          else
          {
             // Video rendition is not yet ready, or could not be generated
              
             // TODO Check if available previews (already generated) list has been loaded - if not call _load() instead, which will then call this method
              if (this.availablePreviews == null) // List of available previews has not yet been loaded
              {
                  // TODO _load() must take a callback fn in order to continue execution after XHR has returned
              }
              
             // Fire off a request to queue the rendition generation
             this._queueVideoThumbnailGeneration();
             
             var msg = '';
             msg += this.wp.msg("label.noVideoAvailable", url);
             msg += '<br/>';
             msg += '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">';
             // TODO Add i18n string label.noVideoDownloadFile and update label.noVideoAvailable
             msg += this.wp.msg("label.noVideoDownloadFile");
             msg += '</a>';
             return '<div class="message">' + msg + '</div>';
             
             // TODO Display splash image behind the message
             //this.widgets.swfPlayerMessage.style.backgroundImage = "url('" + previewCtx.imageurl + "')";
             //this.widgets.swfPlayerMessage.style.height = "200px";
          }
       },
    
       /**
        * Display the Flash video player
        *
        * @method _displayPlayer
        * @private
        */
       _displayPlayer: function FLVPlayer_display(previewCtx)
       {
           // To support "full window" we create a new div that will float above the rest of the ui
           this.createSwfDiv();

           // Create flash web preview by using swfobject
           var swfId = "VideoPreviewer_" + this.wp.id,
               argsNoCache = "?noCacheToken=" + new Date().getTime();
           var so = new YAHOO.deconcept.SWFObject(Alfresco.constants.URL_CONTEXT + "res/extras/components/preview/player_flv_maxi.swf" + argsNoCache,
                 swfId, "100%", "100%", "6.0.0");
           so.addVariable("fileName", this.wp.options.name);
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
           so.write(this.swfDiv.get("id"));

           /**
            * FF3 and SF4 hides the browser cursor if the flashmovie uses a custom cursor
            * when the flash movie is placed/hidden under a div (which is what happens if a dialog
            * is placed on top of the web previewer) so we must turn off custom cursor
            * when the html environment tells us to.
            */
           YAHOO.util.Event.addListener(swfId, "mouseover", function(e)
           {
              var swf = YAHOO.util.Dom.get(swfId);
              if (swf && YAHOO.lang.isFunction(swf.setMode))
              {
                 YAHOO.util.Dom.get(swfId).setMode("active");
              }
           });
           YAHOO.util.Event.addListener(swfId, "mouseout", function(e)
           {
              var swf = YAHOO.util.Dom.get(swfId);
              if (swf && YAHOO.lang.isFunction(swf.setMode))
              {
                 YAHOO.util.Dom.get(swfId).setMode("inactive");
              }
           });

           // Page unload / unsaved changes behaviour
           YAHOO.util.Event.addListener(window, "resize", function ()
           {
              // TODO Do we need to use Bubbling or not? WebPreviewer.js does not
              YAHOO.Bubbling.fire("recalculatePreviewLayout");
              /*
              // Only if not in maximize view
              if (this.swfDiv.getStyle("height") !== "100%")
              {
                 this.synchronizeSwfDivPosition();
              }
              */
           }, this, true);

           // Place the real flash preview div on top of the shadow div
           this.synchronizeSwfDivPosition();
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
       onDocumentDetailsAvailable: function VP_onDocumentDetailsAvailable(p_layer, p_args)
       {
           // TODO Is this method needed in v4.0?
       },

       /**
        * Because the VideoPreview content is absolutely positioned, components which alter DOM layout can fire
        * this event to prompt a recalculation of the absolute coordinates.
        *
        * @method onRecalculatePreviewLayout
        * @param p_layer The type of the event
        * @param p_args Event information
        */
       onRecalculatePreviewLayout: function VP_onRecalculatePreviewLayout(p_layer, p_args)
       {
           // Only if not in maximize view
           if (this.swfDiv.getStyle("height") !== "100%")
           {
              this.synchronizeSwfDivPosition();
           }
       },
       
       /**
        * Load video thumbnail information from the repository, then set up the video previewer
        * 
        * @method _load
        * @private
        */
       _load: function VP__load()
       {
           // Load thumbnail definitions
           Alfresco.util.Ajax.jsonGet(
           {
              url: Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnaildefinitions",
              successCallback:
              {
                 fn: function VP_onLoadThumbnailDefinitions(p_resp, p_obj)
                 {
                     this.previews = p_resp.json;

                     // Load available thumbnail definitions, i.e. which thumbnails have been generated already
                     Alfresco.util.Ajax.jsonGet(
                     {
                        url: Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnails",
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
                               // TODO call display() method via callback
                               this._setupVideoPreview();
                           },
                           scope: this,
                           obj:
                           {
                           }
                        },
                        failureMessage: "Could not load thumbnails list" // TODO localise this error message
                     });
                 },
                 scope: this,
                 obj:
                 {
                 }
              },
              failureMessage: "Could not load thumbnail definitions list" // TODO localise this error message
           });
           
       },
       
       /**
        * Return mime types supported by the video previewer for this file
        * 
        * @method _getSupportedVideoMimeTypes
        * @return Array containing the video MIME types supported by the Flash video player for this file, in order of preference
        */
       _getSupportedVideoMimeTypes: function VP__getSupportedVideoMimeTypes()
       {
           var ps = this.thumbnails, // List of thumbnails that are available (might not have actually been generated yet) 
               flvpreview = "flvpreview", h264preview = "h264preview", 
               flvmimetype = "video/x-flv", h264mimetype = "video/mp4",
               mimetype = this.wp.options.mimeType,
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
        * @method resolveUrls
        * @return An object with two properties - 'videourl' contains the video content URL to use, 'imageurl' contains the still image URL. Either or both properties may be null if no appropriate thumbnail definitions can be found
        */
       resolveUrls: function VP_resolveUrls()
       {
          var ps = this.previews, videopreview,
             psa = this.availablePreviews, 
             flvpreview = "flvpreview", h264preview = "h264preview",
             imgpreview = "imgpreview", imgpreviewfull = "imgpreviewfull",
             videourl, imageurl;
          
          // TODO Only display the original video if this.attributes.src = null, otherwise use the specific thumbnail specified

          // Static image to display before the user clicks 'play'
          imageurl = Alfresco.util.arrayContains(ps, imgpreviewfull) ? 
                this.wp.getThumbnailUrl(imgpreviewfull) : 
                (Alfresco.util.arrayContains(ps, imgpreview) ? this.wp.getThumbnailUrl(imgpreview) : null);
          
          var supportedtypes = this._getSupportedVideoMimeTypes();
          
          // Permissively allow the content item itself to be returned if supported - strict compliance would imply we always return the preferred thumbnail format
          if (Alfresco.util.arrayContains(supportedtypes, this.wp.options.mimeType))
          {
             /* The content matches an image mimetype that the player can handle without a preview */
             videourl = this.wp.getContentUrl();
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
                   videourl = this.wp.getThumbnailUrl(videopreview);
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
       
       _getContentURL: function VP_getContentURL(nodeRef, thumbnailName)
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
       _queueVideoThumbnailGeneration: function VP_queueVideoThumbnailGeneration ()
       {
          var ps = this.previews, videopreview,
          flvpreview = "flvpreview", h264preview = "h264preview";
          
          videopreview = Alfresco.util.arrayContains(ps, h264preview) ? h264preview : (Alfresco.util.arrayContains(ps, flvpreview) ? flvpreview : null);
          
          if (videopreview !== null)
          {
             var actionUrl = YAHOO.lang.substitute(Alfresco.constants.PROXY_URI + "api/node/{nodeRef}/content/thumbnails/{thumbnailname}?c=queue",
             {
                nodeRef: this.wp.options.nodeRef.replace(":/", ""),
                thumbnailname: videopreview
             });
             
             Alfresco.util.Ajax.request(
             {
                method: Alfresco.util.Ajax.GET,
                url: actionUrl,
                successCallback:
                {
                   fn: function VP_onQueueVideoThumbnailSuccess(event, obj)
                   {
                       // TODO Use a timer to check when the thumbnail has been generated
                   },
                   scope: this,
                   obj:
                   {
                   }
                },
                failureCallback:
                {
                   fn: function VP_onQueueVideoThumbnailFailure(event, obj)
                   {
                       // TODO Display an error dialog (and log?) that the thumbnail generation could not be queued
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
        * To support full window mode an extra div (realSwfDivEl) is created with absolute positioning
        * which will have the same position and dimensions as shadowSfwDivEl.
        * The realSwfDivEl element is to make sure the flash move is on top of all other divs and
        * the shadowSfwDivEl element is to make sure the previewer takes the screen real estate it needs.
        *
        * @method createSwfDiv
        */
       createSwfDiv: function WebPreviewer_createSwfDiv()
       {
          if (!this.swfDiv)
          {
             var realSwfDivEl = new YAHOO.util.Element(document.createElement("div"));
             realSwfDivEl.set("id", this.wp.id + "-full-window-div");
             realSwfDivEl.setStyle("position", "absolute");
             realSwfDivEl.addClass("web-preview");
             realSwfDivEl.addClass("real");
             realSwfDivEl.appendTo(document.body);
             this.swfDiv = realSwfDivEl;
          }
       },

       /**
        * Positions the one element over another
        *
        * @method synchronizePosition
        */
       synchronizeSwfDivPosition: function WebPreviewer_synchronizePosition()
       {
          var sourceYuiEl = new YAHOO.util.Element(this.wp.getPreviewerElement());
          var region = YAHOO.util.Dom.getRegion(sourceYuiEl.get("id"));
          this.swfDiv.setStyle("left", region.left + "px");
          this.swfDiv.setStyle("top", region.top + "px");
          this.swfDiv.setStyle("width", region.width + "px");
          this.swfDiv.setStyle("height", region.height + "px");
       }
    };

})();
