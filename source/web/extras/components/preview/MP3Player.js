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
 * This is the "MP3Player" plug-in used to play audio files in the web browser.
 *
 * It supports the "audio/mp3" mime type directly, and other audio types
 * that can be converted into this formats (e.g. via FFmpeg transformations).
 *
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.MP3Player
 * @author Will Abson
 */
(function()
{
    /**
     * MP3 audio mimetype string
     */
    var MIMETYPE_MP3 = "audio/mpeg";
    
    /**
     * H264 video mimetype string
     */
    var MIMETYPE_H264 = "video/mp4";
    
    /**
     * MP3Player plug-in constructor
     * 
     * @param wp {Alfresco.WebPreview} The Alfresco.WebPreview instance that decides which plugin to use
     * @param attributes {Object} Arbitrary attributes brought in from the <plugin> element
     */
    Alfresco.WebPreview.prototype.Plugins.MP3Player = function(wp, attributes)
    {
       /* Decoupled event listeners are added in setOptions */
       YAHOO.Bubbling.on("documentDetailsAvailable", this.onDocumentDetailsAvailable, this);
       YAHOO.Bubbling.on("recalculatePreviewLayout", this.onRecalculatePreviewLayout, this);
        
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
    
    Alfresco.WebPreview.prototype.Plugins.MP3Player.prototype =
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
           * Name of the thumbnail which, if present, is used to display a static image representing the audio
           * before the play button is pressed. Use 'imgpreview' for the scaled-down thumbnail provided by the
           * OOTB config, or 'imgpreviewfull' for the full-size version (config provided by this add-on)
           */
          posterThumbnailName: "imgpreviewfull",

          /**
           * Name of the thumbnail which, if present, contains a MP3 audio rendition of the file
           * 
           * @property mp3ThumbnailName
           * @type String
           * @default "mp3preview"
           */
          mp3ThumbnailName: "mp3preview",
          
          /**
           * Whether to queue missing audio renditions. "true" for queue, "false" for do not queue.
           * 
           * @property queueMissingRenditions
           * @type String
           * @default "true"
           */
          queueMissingRenditions: true,

          /**
           * Whether to auto-play the audio on page load, "true" or "false"
           * 
           * @property autoplay
           * @type string
           * @default "false"
           */
          autoplay: "false",

          /**
           * Whether to auto-load the audio on page load, "true" or "false"
           * 
           * @property autoload
           * @type string
           * @default "true"
           */
          autoload: "true"
       },
    
       /**
        * Tests if the plugin can be used in the users browser.
        *
        * @method report
        * @return {String} Returns nothing if the plugin may be used, otherwise returns a message containing the reason
        *         it cant be used as a string.
        * @public
        */
       report: function MP3Player_report()
       {
           return this._getSupportedMimeTypes().length > 0 ? "" : "No supported MIME type available";
       },
    
       /**
        * Display the node.
        *
        * @method display
        * @public
        */
       display: function MP3Player_display(forceReload)
       {
          var previewCtx = this.resolveUrls();
          if (previewCtx.audiourl) // Present if audio is a natively-previewable type, e.g. mp3
          {
              this._displayPlayer(previewCtx);
          }
          else // Otherwise we need to work out which renditions have already been generated
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
                            fn: function VP_onLoadThumbnails(p_resp, p_obj)
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
                         failureMessage: "Could not load thumbnails list" // TODO localise this error message
                      });
                   }
                }
                else // Otherwise assume that all previews that we can generate are available
                {
                   this.availablePreviews = this.previews;
                }

                previewCtx = this.resolveUrls();
                if (previewCtx.audiourl) // Present if video is a native mimetype, e.g. mp3, or has a suitable pre-generated rendition
                {
                    this._displayPlayer(previewCtx);
                }
                else
                {
                   // Audio rendition is not yet ready, or could not be generated
                   if (this.attributes.queueMissingRenditions && 
                         this.wp.id.indexOf("_quickshare_") == -1)
                   {
                       // Fire off a request to queue the rendition generation, if it's not already been done
                       if (!this.thumbnailQueued)
                       {
                           this._queueAudioThumbnailGeneration();
                           this.thumbnailQueued = true;
                       }
                       
                       // Poll again in 10 seconds, to see if the thumbnail is available yet
                       YAHOO.lang.later(10000, this, this.display, [true]);
                       // Add a message to the preview area to indicate we are waiting for the audio to be converted
                       return this.wp.msg("label.audioConverting");
                   }
                   else
                   {
                       // TODO Add poster behind this message area, if available
                       return this.wp.msg("label.noAudioAvailable") + '<br/><a class="theme-color-1" href="' + 
                          this.wp.getContentUrl(true) + '">' + this.wp.msg("label.noAudioDownloadFile") + '</a>';
                   }
                }
             }
             else
             {
                 // No supported formats available
                 return this.wp.msg("label.noVideoAvailable") + '<br/>' + '<a class="theme-color-1" href="' + this.wp.getContentUrl(true) + '">' + 
                    this.wp.msg("label.noVideoDownloadFile") + '</a>';
             }
          }
       },
    
       /**
        * Display the Flash audio player
        *
        * @method _displayPlayer
        * @private
        */
       _displayPlayer: function MP3Player_display(previewCtx)
       {
           // To support "full window" we create a new div that will float above the rest of the ui
           this.createSwfDiv();
           
           // TODO Use the poster image (if present) dimensions to set the dimensions of the movie player

           // Create flash web preview by using swfobject
           var swfId = "AudioPreviewer_" + this.wp.id,
               argsNoCache = "?noCacheToken=" + new Date().getTime();
           var so = new YAHOO.deconcept.SWFObject(Alfresco.constants.URL_CONTEXT + "res/extras/components/preview/player_mp3_maxi.swf" + argsNoCache,
                 swfId, "100%", "100%", "6.0.0");
           so.addVariable("fileName", this.wp.options.name);
           so.addVariable("mp3", previewCtx.audiourl);
           so.addVariable("title", this.wp.msg("preview.preparingAudio"));
           so.addVariable("showvolume", 1);
           so.addVariable("bgcolor1", "e1e3e5");
           so.addVariable("bgcolor2", "999999");
           so.addVariable("slidercolor1", "999999");
           so.addVariable("slidercolor2", "666666");
           so.addVariable("buttoncolor", "333333");
           so.addVariable("buttonovercolor", "0088de");
           so.addVariable("sliderovercolor", "0088de");
           so.addVariable("autoplay", this.attributes.autoplay == "true" ? 1 : 0);
           so.addVariable("autoload", this.attributes.autoload == "true" ? 1 : 0);
           so.addParam("allowScriptAccess", "sameDomain");
           so.addParam("allowFullScreen", "true");
           so.addParam("quality", "autohigh");
           so.addParam("wmode", "transparent");
           
           // First clear the inner HTML of the previewer elem
           this.wp.getPreviewerElement().innerHTML = "";
           
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
        * Because the preview content is absolutely positioned, components which alter DOM layout can fire
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
        * Return mime types supported by the audio previewer for this file
        * 
        * @method _getSupportedMimeTypes
        * @return Array containing the audio MIME types supported by the Flash audio player for this file, in order of preference
        */
       _getSupportedMimeTypes: function VP__getSupportedMimeTypes()
       {
           var ps = this.previews, // List of thumbnails that are available (might not have actually been generated yet) 
               mp3preview = this.attributes.mp3ThumbnailName, 
               mp3mimetype = MIMETYPE_MP3,
               mimetype = this.wp.options.mimeType,
               mimetypes = [];
          
          // Require Flash player 9.0.45 for MP3 audio
          // TODO verify this version is required
          if ((Alfresco.util.arrayContains(ps, mp3preview) || mimetype == mp3mimetype) && Alfresco.util.hasRequiredFlashPlayer(9, 0, 45))
          {
             mimetypes.push(mp3mimetype);
          }
          return mimetypes;
       },

       /**
        * Helper method for deciding what previews to use to display the audio content plus a still image from the audio
        *
        * @method resolveUrls
        * @return An object with two properties - 'audiourl' contains the audio content URL to use, 'imageurl' contains the still image URL. Either or both properties may be null if no appropriate thumbnail definitions can be found
        */
       resolveUrls: function VP_resolveUrls()
       {
          var ps = this.previews, audiopreview,
             psa = this.availablePreviews, 
             mp3preview = this.attributes.mp3ThumbnailName,
             imgpreview = this.attributes.posterThumbnailName,
             audiourl, imageurl;

          // Static image to display before the user clicks 'play' - we do not care if this has been generated already or not
          imageurl = Alfresco.util.arrayContains(ps, imgpreview) ? this.wp.getThumbnailUrl(imgpreview) : null;
          
          var supportedtypes = this._getSupportedMimeTypes();
          
          // Permissively allow the content item itself to be returned if supported - strict compliance would imply we always return the preferred thumbnail format
          if (Alfresco.util.arrayContains(supportedtypes, this.wp.options.mimeType))
          {
             /* The content matches an image mimetype that the player can handle without a preview */
             audiourl = this.wp.getContentUrl();
             return (
             {
                audiourl: audiourl,
                imageurl: imageurl
             });
          }
          else
          {
             // Always use the preferred thumbnail format, even if less-preferred formats are available and have been generated already
              audiopreview = supportedtypes.length > 0 ? (supportedtypes[0] == MIMETYPE_MP3 ? mp3preview : null) : null;
             
             if (audiopreview !== null) // Can the content can be previewed?
             {
                if (this.availablePreviews != null && Alfresco.util.arrayContains(psa, audiopreview)) // Is a audio preview available (i.e already generated)?
                {
                   audiourl = this.wp.getThumbnailUrl(audiopreview);
                }
                return (
                {
                   audiourl: audiourl,
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
        * Fire off a request to the repository to queue the creation of audio renditions. This will return a 404 if the queue request
        * completes successfully, or a 500 if an error occurs
        * 
        * @method _queueAudioThumbnailGeneration
        * @return
        */
       _queueAudioThumbnailGeneration: function VP_queueAudioThumbnailGeneration ()
       {
          var ps = this.previews, audiopreview,
             mp3preview = this.attributes.mp3ThumbnailName;
          
          audiopreview = Alfresco.util.arrayContains(ps, mp3preview) ? mp3preview : null;
          
          if (audiopreview !== null)
          {
             var actionUrl = YAHOO.lang.substitute(Alfresco.constants.PROXY_URI + "api/node/{nodeRef}/content/thumbnails/{thumbnailname}?c=queue",
             {
                nodeRef: this.wp.options.nodeRef.replace(":/", ""),
                thumbnailname: audiopreview
             });
             
             Alfresco.util.Ajax.request(
             {
                method: Alfresco.util.Ajax.GET,
                url: actionUrl,
                successCallback:
                {
                   fn: function VP_onQueueAudioThumbnailSuccess(event, obj)
                   {
                   },
                   scope: this
                },
                failureCallback:
                {
                   fn: function VP_onQueueAudioThumbnailFailure(event, obj)
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
