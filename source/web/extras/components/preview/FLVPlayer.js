/**
 * Copyright (C) 20010-2011 Alfresco Share Extras project
 *
 * This file is part of the Alfresco Share Extras project.
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
 * This is the "FLVPlayer" plug-in used to display documents directly in the web browser.
 *
 * It supports the "video/x-flv" and "video/mp4" mime types directly, and other video types
 * that can be converted into these formats (e.g. via FFmpeg transformations).
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
    const MIMETYPE_FLV = "video/x-flv";
    
    /**
     * H264 video mimetype string
     */
    const MIMETYPE_H264 = "video/mp4";
    
    /**
     * H264 (m4v) video mimetype string
     */
    const MIMETYPE_M4V = "video/x-m4v";
    
    /**
     * FLVPlayer plug-in constructor
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
       this.previews = this.wp.options.thumbnails;
       this.availablePreviews = null;
       this.thumbnailQueued = false;
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
           * Maximum size to display given in bytes if the node's content is used.
           * If the node content is larger than this value the image won't be displayed.
           * Note! This doesn't apply if a thumbnail is used.
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
          disableI18nInputFix: "false",

          /**
           * Name of the thumbnail which, if present, is used to display a static image representing the video
           * before the play button is pressed. Use 'imgpreview' for the scaled-down thumbnail provided by the
           * OOTB config, or 'imgpreviewfull' for the full-size version (config provided by this add-on)
           */
          posterThumbnailName: "imgpreviewfull",

          /**
           * Name of the thumbnail which, if present, contains a Flash video rendition of the video
           */
          flvThumbnailName: "flvpreview",
          
          /**
           * Name of the thumbnail which, if present, contains a H264 rendition of the video
           */
          h264ThumbnailName: "h264preview",
          
          /**
           * Whether to queue missing video renditions
           */
          queueMissingRenditions: true
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
          var previewCtx = this.resolveUrls();
          
          if (previewCtx.videourl) // Present if video is a natively-previewable type, e.g. flv or mp4
          {
              this._displayPlayer(previewCtx);
          }
          else // Otherwise we need to work out which renditions have already been generated
          {
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

                       var previewCtx = this.resolveUrls();

                       /*
                        * TODO Add logic for maximum file size
                        * 
                        *  var srcMaxSize = this.attributes.srcMaxSize;
                        *  if (!this.attributes.src && srcMaxSize.match(/^\d+$/) && this.wp.options.size > parseInt(srcMaxSize))
                        *  {
                        *  }
                       */
                       
                       if (previewCtx.videourl) // Present if video is a native mimetype, e.g. mp4
                       {
                           this._displayPlayer(previewCtx);
                       }
                       else
                       {
                          // Video rendition is not yet ready, or could not be generated
                          if (this.attributes.queueMissingRenditions)
                          {
                              // Fire off a request to queue the rendition generation, if it's not already been done
                              if (!this.thumbnailQueued)
                              {
                                  this._queueVideoThumbnailGeneration();
                                  this.thumbnailQueued = true;
                              }
                              
                              // Add a message to the preview area to indicate we are waiting for the video to be converted
                              var pEl = this.wp.getPreviewerElement();
                              pEl.innerHTML = "";
                              var msgEl = document.createElement("div");
                              // TODO Add poster behind this message area, if available
                              //previewCtx.imageurl
                              //msgEl.set("id", this.wp.id + "-full-window-div");
                              //msgEl.setStyle("position", "absolute");
                              Dom.addClass(msgEl, "message");
                              msgEl.innerHTML = this.wp.msg("label.videoConverting");
                              pEl.appendChild(msgEl);
                              
                              // Poll again in 10 seconds, to see if the thumbnail is available yet
                              YAHOO.lang.later(10000, this, this.display);
                              
                              return pEl.innerHTML;
                          }
                          else
                          {
                              var pEl = this.wp.getPreviewerElement();
                              
                              pEl.innerHTML = "";
                              
                              var msgEl = document.createElement("div");
                              Dom.addClass(msgEl, "message");

                              // TODO Add poster behind this message area, if available
                              var msg = '';
                              msg += this.wp.msg("label.noVideoAvailable");
                              msg += '<br/>';
                              msg += '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">';
                              msg += this.wp.msg("label.noVideoDownloadFile");
                              msg += '</a>';

                              msgEl.innerHTML = msg;
                              pEl.appendChild(msgEl);
                              
                              return pEl.innerHTML;
                          }
                       }
                   },
                   scope: this
                },
                failureMessage: "Could not load thumbnails list" // TODO localise this error message
             });
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
           
           // TODO Use the poster image (if present) dimensions to set the dimensions of the movie player

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
           // TODO Investigate if this method needed in v4.0, and implement if so
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
        * Return mime types supported by the video previewer for this file
        * 
        * @method _getSupportedVideoMimeTypes
        * @return Array containing the video MIME types supported by the Flash video player for this file, in order of preference
        */
       _getSupportedVideoMimeTypes: function VP__getSupportedVideoMimeTypes()
       {
           var ps = this.previews, // List of thumbnails that are available (might not have actually been generated yet) 
               flvpreview = this.attributes.flvThumbnailName, h264preview = this.attributes.h264ThumbnailName, 
               mimetype = this.wp.options.mimeType,
               mimetypes = [];
          
          // Require Flash player 9.0.115 (9 beta 3) for h264 video
          if ((Alfresco.util.arrayContains(ps, h264preview) || mimetype == MIMETYPE_H264 || mimetype == MIMETYPE_M4V) && Alfresco.util.hasRequiredFlashPlayer(9, 0, 115))
          {
             mimetypes.push(MIMETYPE_H264);
             mimetypes.push(MIMETYPE_M4V);
          }
          if ((Alfresco.util.arrayContains(ps, flvpreview) || mimetype == MIMETYPE_FLV) && Alfresco.util.hasRequiredFlashPlayer(6, 0, 0))
          {
             mimetypes.push(MIMETYPE_FLV);
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
             flvpreview = this.attributes.flvThumbnailName, h264preview = this.attributes.h264ThumbnailName,
             imgpreview = this.attributes.posterThumbnailName,
             videourl, imageurl;

          // Static image to display before the user clicks 'play' - we do not care if this has been generated already or not
          imageurl = Alfresco.util.arrayContains(ps, imgpreview) ? this.wp.getThumbnailUrl(imgpreview) : null;
          
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
             videopreview = supportedtypes.length > 0 ? (supportedtypes[0] == MIMETYPE_H264 ? h264preview : (supportedtypes[0] == MIMETYPE_FLV ? flvpreview : null)) : null;
             
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
        * @method _queueVideoThumbnailGeneration
        * @return
        */
       _queueVideoThumbnailGeneration: function VP_queueVideoThumbnailGeneration ()
       {
          var ps = this.previews, videopreview,
          flvpreview = this.attributes.flvThumbnailName, h264preview = this.attributes.h264ThumbnailName;
          
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
                   },
                   scope: this
                },
                failureCallback:
                {
                   fn: function VP_onQueueVideoThumbnailFailure(event, obj)
                   {
                       // TODO Display an error dialog (and log?) that the thumbnail generation could not be queued, if we get a non-404 response code
                   },
                   scope: this
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
