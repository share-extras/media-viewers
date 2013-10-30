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
 * This is the "FLVPlayer" plug-in used to display video directly in the web browser.
 *
 * It supports the "video/x-flv", "video/mp4" and "video/x-m4v" mime types directly, and 
 * other types that can be converted into these formats (e.g. via FFmpeg transformations).
 *
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.FLVPlayer
 * @author Will Abson
 */
(function()
{
    /**
     * Flash video mimetype string
     */
    var MIMETYPE_FLV = "video/x-flv";
    
    /**
     * H264 video mimetype string
     */
    var MIMETYPE_H264 = "video/mp4";
    
    /**
     * H264 (m4v) video mimetype string
     */
    var MIMETYPE_M4V = "video/x-m4v";
    
    /**
     * Cropped image preview thumbnail name
     */
    var THUMBNAIL_IMGPREVIEW = "imgpreview";
    
    /**
     * Full image preview thumbnail name
     */
    var THUMBNAIL_IMGPREVIEWFULL = "imgpreviewfull";
    
    /**
     * YUI aliases
     */
    var Dom = YAHOO.util.Dom, 
       Event = YAHOO.util.Event, 
       Element = YAHOO.util.Element;
    
    /**
     * FLVPlayer plug-in constructor
     * 
     * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
     * @param attributes {Object} Arbitrary attributes brought in from the <plugin> element
     */
    Alfresco.WebPreview.prototype.Plugins.FLVPlayer = function(wp, attributes)
    {
       this.wp = wp;
       this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
       this.swfDiv = null;
       this.previews = this.wp.options.thumbnails;
       this.availablePreviews = null;
       if (typeof wp.options.thumbnailModification === "object")
       {
          this.availablePreviews = [];
          for (var i = 0; i < wp.options.thumbnailModification.length; i++)
          {
             this.availablePreviews.push(wp.options.thumbnailModification[i].split(":")[0]);
          }
       }
       this.thumbnailQueued = false;
       return this;
    };
    
    Alfresco.WebPreview.prototype.Plugins.FLVPlayer.prototype =
    {
       /**
        * Plugin configuration attributes
        * 
        * @property attributes
        * @type object
        */
       attributes:
       {
          /**
           * Maximum size to display given in bytes if the node's content is used (not currently used).
           * If the node content is larger than this value the image won't be displayed.
           * Note! This doesn't apply if a thumbnail is used.
           *
           * @property srcMaxSize
           * @type String
           * @default "100000000"
           */
          srcMaxSize: "100000000",

          /**
           * Name of the thumbnail which, if present, is used to display a static image representing the video
           * before the play button is pressed. Use 'imgpreview' for the scaled-down thumbnail provided by the
           * OOTB config, or 'imgpreviewfull' for the full-size version (config provided by this add-on).
           * 
           * Important: Sizing of the player to the dimensions of the video is dependent on the use of the 
           * 'imgpreviewfull' thumbnail.
           * 
           * @property poster
           * @type string
           */
          poster: THUMBNAIL_IMGPREVIEWFULL,
          
          /**
           * Whether to queue missing video renditions. "true" for queue, "false" for do not queue.
           * 
           * @property queueMissingRenditions
           * @type string
           * @default "true"
           */
          queueMissingRenditions: "true",

          /**
           * Whether to auto-play the video on page load, "true" or "false"
           * 
           * @property autoplay
           * @type string
           * @default "false"
           */
          autoplay: "false",

          /**
           * Whether to auto-load the video on page load, "true" or "false"
           * 
           * @property autoload
           * @type string
           * @default "true"
           */
          autoload: "true",

          /**
           * Color of the player in hex notation, without the initial '#'
           * 
           * @property playercolor
           * @type string
           * @default "e1e3e5"
           */
          playercolor: "e1e3e5",

          /**
           * Color of the player button icons in hex notation
           * 
           * @property buttoncolor
           * @type string
           * @default "000000"
           */
          buttoncolor: "000000",

          /**
           * Hover color of the player buttons in hex notation
           * 
           * @property buttonovercolor
           * @type string
           * @default "0088de"
           */
          buttonovercolor: "0088de",

          /**
           * Hover color of the player slider in hex notation
           * 
           * @property sliderovercolor
           * @type string
           * @default "0088de"
           */
          sliderovercolor: "0088de",

          /**
           * Whether to show the full screen button, "true" or "false"
           * 
           * @property showfullscreen
           * @type string
           * @default "true"
           */
          showfullscreen: "true",

          /**
           * Whether to show the play button, "true" or "false"
           * 
           * @property showiconplay
           * @type string
           * @default "true"
           */
          showiconplay: "true",

          /**
           * Whether to show the volume control, "true" or "false"
           * 
           * @property showvolume
           * @type string
           * @default "true"
           */
          showvolume: "true",

          /**
           * Whether to show the elapsed time in the player, "true" or "false"
           * 
           * @property showtime
           * @type string
           * @default "true"
           */
          showtime: "true",

          /**
           * Margin in pixels around the player
           * 
           * @property playermargin
           * @type string
           * @default "0"
           */
          playermargin: "0",
          
          /**
           * Mimetypes supported by the player, including thumbnail names and versions of flash required for each type
           * 
           * @property playerSupportedTypes
           * @type array
           */
          playerSupportedTypes: [
             {
                // Require Flash player 9.0.115 (9 beta 3) for h264 video
                mimetype: MIMETYPE_H264,
                thumbnailName: "h264preview",
                minFlashVersion: [9, 0, 115]
             },
             {
                mimetype: MIMETYPE_M4V,
                thumbnailName: null,
                minFlashVersion: [9, 0, 115]
             },
             {
                mimetype: MIMETYPE_FLV,
                thumbnailName: "flvpreview",
                minFlashVersion: [6, 0, 0]
             }
          ]
       },
       
       /**
        * Width of the video being played, in pixels
        * 
        * @property videoWidth
        * @type int
        * @default 0
        */
       videoWidth: 0,

       /**
        * Height of the video being played, in pixels
        * 
        * @property videoHeight
        * @type int
        * @default 0
        */
       videoHeight: 0,
    
       /**
        * Tests if the plugin can be used in the users browser.
        *
        * @method report
        * @return {String} Returns nothing if the plugin may be used, otherwise returns a message containing the reason
        *         it can't be used as a string.
        * @public
        */
       report: function FLVPlayer_report()
       {
           return this._getSupportedMimeTypes().length > 0 ? "" : this.wp.msg("error.noSupportedVideoType");
       },
    
       /**
        * Display the node using this plugin.
        *
        * @method display
        * @public
        */
       display: function FLVPlayer_display(forceReload)
       {
          // Set up message area
          this.msgEl = Dom.getFirstChild(this.wp.getPreviewerElement());
          
          var previewCtx = this.resolveUrls();
          if (previewCtx.videourl) // Present if video is a natively-previewable type, e.g. flv or mp4, or has a pre-generated rendition of this type
          {
              this._displayPlayer(previewCtx);
          }
          else // Otherwise we need to work out which renditions can be generated
          {
             if (this._getSupportedMimeTypes().length > 0)
             {
                if (this.wp.id.indexOf("_quickshare_") == -1) // Check that we are not in the QuickShare screen (no external API access)
                {
                   if (this.availablePreviews === null || forceReload === true) // Pre-4.2 the generated thumnails list is not provided
                   {
                      // Load available thumbnail definitions, i.e. which thumbnails have been generated already
                      Alfresco.util.Ajax.jsonGet(
                      {
                         url: Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnails",
                         successCallback:
                         {
                            fn: function FLVPlayer_onLoadThumbnails(p_resp, p_obj)
                            {
                                var thumbnails = [];
                                for (var i = 0; i < p_resp.json.length; i++)
                                {
                                    thumbnails.push(p_resp.json[i].thumbnailName);
                                }
                                this.availablePreviews = thumbnails;
                                // Call self
                                this.display.call(this);
                            },
                            scope: this
                         },
                         failureMessage: this.wp.msg("error.thumbnailsFailure")
                      });
                   }
                }
                else // Otherwise assume that all previews that we can generate are available
                {
                   this.availablePreviews = this.previews;
                }

                previewCtx = this.resolveUrls();
                if (previewCtx.videourl) // Present if video is a native mimetype, e.g. mp4
                {
                    this._displayPlayer(previewCtx);
                }
                else
                {
                   // Video rendition is not yet ready, or could not be generated
                   if (this.attributes.queueMissingRenditions == "true" && 
                         this.wp.id.indexOf("_quickshare_") == -1)
                   {
                       // Fire off a request to queue the rendition generation, if it's not already been done
                       if (!this.thumbnailQueued)
                       {
                           this._queueThumbnailGeneration();
                           this.thumbnailQueued = true;
                       }
                       
                       // Poll again in 10 seconds, to see if the thumbnail is available yet
                       YAHOO.lang.later(10000, this, this.display, [true]);
                       // Add a message to the preview area to indicate we are waiting for the video to be converted
                       return this._displayMessage(this.wp.msg("label.videoConverting"), previewCtx);
                   }
                   else
                   {
                       // No pre-generated rendition available and unable to queue up
                       return this._displayMessage(this.wp.msg("label.noVideoAvailable") + '<br/>' + '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">' + 
                          this.wp.msg("label.noVideoDownloadFile") + '</a>', previewCtx);
                   }
                }
             }
             else
             {
                 // No supported formats available
                 return this._displayMessage(this.wp.msg("label.noVideoAvailable") + '<br/>' + '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">' + 
                    this.wp.msg("label.noVideoDownloadFile") + '</a>', previewCtx);
             }
          }
       },
       
       /**
        * Return a message to display within the previewer element, e.g. video being converted or could not be displayed. Use
        * the return value to return from display(), which will be set as the innerHTML of the area.
        *
        * @method _displayMessage
        * @private
        * @param {string} msg Text or HTML mark-up to display in the message area
        * @param {object} previewCtx Preview context object, with 'imageurl' and 'videourl' properties set
        * @return {string} The innerHTML property of the web-preview element, after setting the message
        */
       _displayMessage: function FLVPlayer_displayMessage(msg, previewCtx)
       {
          var msgEl = this._findOrCreateChildElement(this.wp.getPreviewerElement(), "div", "message");
          if (!Dom.getAttribute(msgEl, "id"))
          {
             msgEl.innerHTML = "";
             Dom.setAttribute(msgEl, "id", this.wp.id + "-message");
          }
          var msgSpanEl = this._findOrCreateChildElement(this._findOrCreateChildElement(msgEl, "span"), "span");
          msgSpanEl.innerHTML = msg;
          Dom.setStyle(msgSpanEl, "display", msg == "" ? "none" : "inline");

          // Use the poster image (if present) dimensions to set the dimensions of the movie player
          if (previewCtx && previewCtx.imageurl && this.attributes.poster == THUMBNAIL_IMGPREVIEWFULL && !this.addingMsgBg) // Is a poster image available
          {
             this.addingMsgBg = true;
             var bgEl = this.createFloatingDiv(this.wp.id + "-message-bg");
             var imgNode = document.createElement("IMG");
             var imgEl = new Element(imgNode);
             imgEl.set("src", previewCtx.imageurl);
             Event.addListener(imgNode, "load", function(ev, obj) {
                var region = Dom.getRegion(ev.currentTarget);
                this.videoWidth = region.width, this.videoHeight = region.height;
                var size = this._calculateVideoDimensions();
                // Place the real flash preview div on top of the shadow div
                this.synchronizeElementPosition(bgEl, size.width, size.height);
                imgEl.setStyle("width", "" + size.width + "px");
                imgEl.setStyle("height", "" + (size.height - 20) + "px");
                // Now set height of the previewer element, ready for the video
                Dom.setStyle(this.wp.getPreviewerElement(), "height", "" + size.height + "px");
                var msgEl = Dom.get(this.wp.id + "-message");
                var spanEl = this._findOrCreateChildElement(msgEl, "span");
                Dom.insertBefore(imgNode, spanEl);
                Dom.addClass(spanEl, "overlay");
                Dom.setStyle(spanEl, "top", "-" + (size.height/2) + "px");
                Dom.setStyle(msgEl, "padding-top", "0");
                // Remove old div
                document.body.removeChild(Dom.get(bgEl.get("id")));
             }, null, this);
             imgEl.appendTo(bgEl);
             this.synchronizeElementPosition(bgEl);
          }
          
          return this.wp.getPreviewerElement().innerHTML;
       },
       
       /**
        * Display the previewer
        *
        * @method _displayPlayer
        * @private
        */
       _displayPlayer: function FLVPlayer_displayPlayer(previewCtx)
       {
           // To support "full window" we create a new div that will float above the rest of the ui
           this.createSwfDiv();
          
           // Use the poster image (if present) dimensions to set the dimensions of the movie player
           if (previewCtx.imageurl && this.attributes.poster == THUMBNAIL_IMGPREVIEWFULL) // Is a poster image available
           {
              this.createPosterDiv();
              var imgNode = document.createElement("IMG");
              this.posterImgEl = new Element(imgNode);
              this.posterImgEl.set("src", previewCtx.imageurl);
              Event.addListener(imgNode, "load", function(ev, obj) {
                 var region = Dom.getRegion(ev.currentTarget);
                 this.videoWidth = region.width, this.videoHeight = region.height;
                 document.body.removeChild(Dom.get(this.posterDiv.get("id"))); // remove floating div now we are finished with it
                 this._displayMessage(""); // clear the message area
                 this._displaySwfPlayer(previewCtx);
                 // Place the real flash preview div on top of the shadow div
                 this.synchronizeSwfDivPosition();
                 // Now set height of the previewer element, if no height already applied
                 var size = this._calculateVideoDimensions();
                 Dom.setStyle(this.wp.getPreviewerElement(), "height", "" + size.height + "px");
              
              }, null, this);
              this.posterImgEl.appendTo(this.posterDiv);
              this.synchronizeElementPosition(this.posterDiv);
           }
           else
           {
              this._displayMessage(""); // clear the message area
              this._displaySwfPlayer(previewCtx);

              // Place the real flash preview div on top of the shadow div
              this.synchronizeSwfDivPosition();
           }
       },
    
       /**
        * Display the Flash player
        *
        * @method _displaySwfPlayer
        * @private
        * @param {object} previewCtx Preview context object, with 'imageurl' and 'videourl' properties set
        */
       _displaySwfPlayer: function FLVPlayer_displaySwfPlayer(previewCtx)
       {
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
          so.addVariable("autoplay", this.attributes.autoplay == "true" ? 1 : 0);
          so.addVariable("autoload", this.attributes.autoload == "true" ? 1 : 0);
          so.addVariable("showfullscreen", this.attributes.showfullscreen == "true" ? 1 : 0);
          so.addVariable("showiconplay", this.attributes.showiconplay == "true" ? 1 : 0);
          so.addVariable("showvolume", this.attributes.showvolume == "true" ? 1 : 0);
          so.addVariable("showtime", this.attributes.showtime == "true" ? 1 : 0);
          so.addVariable("playercolor", this.attributes.playercolor);
          so.addVariable("buttoncolor", this.attributes.buttoncolor);
          so.addVariable("buttonovercolor", this.attributes.buttonovercolor);
          so.addVariable("sliderovercolor", this.attributes.sliderovercolor);
          so.addVariable("margin", this.attributes.playermargin);
          so.addVariable("showplayer", "always");
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
          Event.addListener(window, "resize", this.onRecalculatePreviewLayout, this, true);
       },

       /**
        * Because the VideoPreview content is absolutely positioned, components which alter DOM layout can fire
        * this event to prompt a recalculation of the absolute coordinates.
        *
        * @method onRecalculatePreviewLayout
        * @private
        * @param ev {object} Event information
        */
       onRecalculatePreviewLayout: function FLVPlayer_onRecalculatePreviewLayout(ev)
       {
           // Only if not in maximize view
           if (this.swfDiv.getStyle("height") !== "100%")
           {
              this.synchronizeSwfDivPosition();
              // Also set height of the previewer element, if no height already applied
              var size = this._calculateVideoDimensions();
              Dom.setStyle(this.wp.getPreviewerElement(), "height", "" + size.height + "px");
           }
       },
       
       /**
        * Return mime types supported by the video previewer for this file
        * 
        * @method _getSupportedMimeTypes
        * @private
        * @return {array} Array containing the video MIME types supported by the Flash video player for this file, in order of preference
        */
       _getSupportedMimeTypes: function FLVPlayer__getSupportedMimeTypes()
       {
          var ps = this.previews, // List of thumbnails that are available (might not have actually been generated yet) 
               mimetype = this.wp.options.mimeType, // Mimetype of the file itself
               supportedMimetypes = [];
          
          var type, thumbnailName, minFlashVersion, hasRequiredFlashPlayer, i, ii;
          // look through each mime type that the player supports
          for (i = 0, ii = this.attributes.playerSupportedTypes.length; i < ii; i++)
          {
             type = this.attributes.playerSupportedTypes[i];
             thumbnailName = type.thumbnailName || null;
             minFlashVersion = type.minFlashVersion || null;
             hasRequiredFlashPlayer = minFlashVersion && Alfresco.util.hasRequiredFlashPlayer(minFlashVersion[0], minFlashVersion[1], minFlashVersion[2])
             if ((mimetype == type.mimetype || thumbnailName && Alfresco.util.arrayContains(ps, thumbnailName)) && hasRequiredFlashPlayer)
             {
                supportedMimetypes.push(type.mimetype);
             }
          }
          return supportedMimetypes;
       },

       /**
        * Helper method for deciding what previews to use to display the video content plus a still 'poster' image from the video
        *
        * @method resolveUrls
        * @private
        * @return {object} An object with two properties - 'videourl' contains the video content URL to use, 'imageurl' contains the still image URL. Either or both properties may be null if no appropriate thumbnail definitions can be found
        */
       resolveUrls: function FLVPlayer_resolveUrls()
       {
          var ps = this.previews, 
             psa = this.availablePreviews, 
             videourl, imageurl;

          // Static image to display before the user clicks 'play' - we do not care if this has been generated already or not
          imageurl = Alfresco.util.arrayContains(ps, this.attributes.poster) ? this.wp.getThumbnailUrl(this.attributes.poster) : null;
          
          var supportedtypes = this._getSupportedMimeTypes();
          
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
             var videopreview = null;
             if  (supportedtypes.length > 0)
             {
                var type, i, ii;
                // look through each mime type that the player supports
                for (i = 0, ii = this.attributes.playerSupportedTypes.length; i < ii; i++)
                {
                   type = this.attributes.playerSupportedTypes[i];
                   if (Alfresco.util.arrayContains(supportedtypes, type.mimetype) && type.thumbnailName)
                   {
                      videopreview = type.thumbnailName;
                      break;
                   }
                }
             }
             
             if (videopreview !== null) // Can the content can be previewed?
             {
                if (this.availablePreviews != null && Alfresco.util.arrayContains(psa, videopreview)) // Is a video preview available (i.e already generated)?
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
       
       /**
        * Fire off a request to the repository to queue the creation of video renditions. This will return a 404 if the queue request
        * completes successfully, or a 500 if an error occurs
        * 
        * @method _queueThumbnailGeneration
        * @private
        * @return
        */
       _queueThumbnailGeneration: function FLVPlayer_queueThumbnailGeneration ()
       {
          var ps = this.previews, videopreview = null,
             mimetype = this.wp.options.mimeType, // Mimetype of the file itself
             supportedtypes = this._getSupportedMimeTypes(), type, i, ii;

          // look through each mime type that the player supports
          for (i = 0, ii = this.attributes.playerSupportedTypes.length; i < ii; i++)
          {
             type = this.attributes.playerSupportedTypes[i];
             if (mimetype != type.mimetype && type.thumbnailName && Alfresco.util.arrayContains(supportedtypes, type.mimetype))
             {
                videopreview = type.thumbnailName;
                break;
             }
          }
          
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
                   fn: function FLVPlayer_onQueueVideoThumbnailSuccess(event, obj)
                   {
                   },
                   scope: this
                },
                failureCallback:
                {
                   fn: function FLVPlayer_onQueueVideoThumbnailFailure(event, obj)
                   {
                      // Display an error dialog (and log?) that the thumbnail generation could not be queued, if we get a non-404 response code
                      if (event.serverResponse.status != 404)
                      {
                         Alfresco.logger.error('Error, Alfresco.WebPreview.Plugins.FLVPlayer failed to queue thumbnail generation (got status code ' + event.serverResponse.status + ')');
                      }
                   },
                   scope: this
                }
             });
          }
       },

       /**
        * To support full window mode an extra floating div (with class 'real') is created with absolute positioning
        * which will have the same position and dimensions as the main web-preview element.
        * 
        * The real element is to make sure the flash move is on top of all other divs and
        * the underlying element is to make sure the previewer reserves the screen real estate it needs.
        *
        * @method createSwfDiv
        * @private
        */
       createSwfDiv: function FLVPlayer_createSwfDiv()
       {
          if (!this.swfDiv)
          {
             this.swfDiv = this.createFloatingDiv(this.wp.id + "-full-window-div");
             this.swfDiv.addClass("web-preview");
             this.swfDiv.addClass("real");
          }
       },

       /**
        * A second absolutely-positioned div for the movie poster. We could create this inside the main web-preview
        * element but the parent WebPreviewer instancer may set the innerHTML property of that element, which 
        * wipes out any event listeners attached to elements within it.
        * 
        * We need to know when the poster image has loaded, so we can find out the dimensions of the video, and 
        * therefore we use this second external element to hold it.
        *
        * @method createPosterDiv
        * @private
        */
       createPosterDiv: function FLVPlayer_createPosterDiv()
       {
          if (!this.posterDiv)
          {
             this.posterDiv = this.createFloatingDiv(this.wp.id + "-poster-div");
             this.posterDiv.addClass("web-preview-poster");
          }
       },

       /**
        * Create a floating div with absolute positioning
        *
        * @method createSwfDiv
        * @private
        */
       createFloatingDiv: function FLVPlayer_createFloatingDiv(elId)
       {
          var realSwfDivEl = new Element(document.createElement("div"));
          realSwfDivEl.set("id", elId);
          realSwfDivEl.setStyle("position", "absolute");
          realSwfDivEl.appendTo(document.body);
          return realSwfDivEl;
       },

       /**
        * Position the floating SWF div, which contains the player SWF file over the main web-preview 
        * element. The floating element will be positioned such that it is centred over the base 
        * element, with the player sized to the dimensions of the video, if this is known.
        * 
        * If the player dimensions would be larger than the underlying element then the floating div
        * will be scaled to fit within it, while preserving the aspect ratio.
        * 
        * If the video dimensions are not known then the floating element will take up the full 
        * area of the web-preview element.
        *
        * @method synchronizePosition
        * @private
        */
       synchronizeSwfDivPosition: function FLVPlayer_synchronizeSwfDivPosition()
       {
          var size = this._calculateVideoDimensions();
          this.synchronizeElementPosition(this.swfDiv, size.width, size.height);
       },

       /**
        * Position the given element over the main web-preview element
        *
        * @method synchronizePosition
        * @private
        */
       synchronizeElementPosition: function FLVPlayer_synchronizeElementPosition(el, width, height)
       {
          var sourceYuiEl = new Element(this.wp.getPreviewerElement());
          var region = Dom.getRegion(sourceYuiEl.get("id"));
          if (width)
          {
             var wdiff = (region.width - width) / 2;
             el.setStyle("left", (region.left + wdiff) + "px");
             el.setStyle("width", width + "px");
          }
          else
          {
             el.setStyle("left", region.left + "px");
             el.setStyle("width", region.width + "px");
          }
          el.setStyle("top", region.top + "px");
          el.setStyle("height", (height || region.height) + "px");
       },

       /**
        * Calculate the dimensions the video player should take up in the current container. The player will be resized if necessary
        * to fit the horizontal bounds, and if placed inside a dashlet, also the vertical bounds of the container.
        * 
        * The method ensures that the aspect ratio of the video object is preserved, if resizing is necessary.
        *
        * @method calculateVideoDimensions
        * @private
        * @return {object} Object containing 'width' and 'height' properties, set to the dimensions the player should assume. If the
        * dimensions of the video are not known then both properties will be set to zero.
        */
       _calculateVideoDimensions: function FLVPlayer__calculateVideoDimensions()
       {
          var toolbarHeight = 20; // Height of the bottom toolbar in px
          var pwidth = this.videoWidth, pheight = this.videoHeight ? this.videoHeight + toolbarHeight : this.videoHeight; // toolbar at bottom takes up 20px
          // Check image width does not exceed width of parent el
          var cregion = Dom.getRegion(this.wp.getPreviewerElement());
          if (pwidth > cregion.width)
          {
             var scaleFactor = cregion.width / pwidth;
             pwidth = cregion.width;
             pheight = Math.floor((pheight - toolbarHeight) * scaleFactor) + toolbarHeight;
          }
          // Check if we are running in a dashlet, and may need to reduce the size further
          var dashletBody = Dom.getAncestorByClassName(this.wp.getPreviewerElement(), "body");
          if (dashletBody)
          {
             var bodyHeight = Dom.getRegion(dashletBody).height;
             if (pheight > bodyHeight)
             {
                var scaleFactor = (bodyHeight - toolbarHeight) / (pheight - toolbarHeight);
                pwidth = Math.floor(pwidth * scaleFactor);
                pheight = bodyHeight;
             }
          }
          return {
             width: pwidth,
             height: pheight
          };
       },

       /**
        * Locate the first child element with the given tag name or class name, and create it if it doesn't exist
        * 
        * @param baseEl {HTMLElement}  Base element to search within. Only direct children will be searched
        * @param tagName {string}      Name of the tag to match. Either tagName or className must be provided, or both.
        * @param className {string}    Name of the tag to match. Either tagName or className must be provided, or both.
        *
        * @method _findOrCreateChildElement
        * @private
        * @return {object} First matching element object, or if no matching element was found the new node that was created
        */
       _findOrCreateChildElement: function FLVPlayer_findOrCreateElement(baseEl, tagName, className) {
          var els = Dom.getChildrenBy(baseEl, function(el) {
             return (!tagName || el.tagName.toLowerCase() == tagName.toLowerCase()) && (!className || Dom.hasClass(el, className));
          });
          if (els.length > 0)
          {
             return els[0];
          }
          else
          {
             var newEl = document.createElement(tagName);
             if (className)
             {
                Dom.addClass(newEl, className);
             }
             baseEl.appendChild(newEl);
             return newEl;
          }
       }
    };

})();
