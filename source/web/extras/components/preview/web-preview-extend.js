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
 * This is an extension that augments Alfresco.WebPreview
 * with functions and properties that can be used by all viewers.
 *
 * @namespace ShareExtras
 * @class ShareExtras.ViewerExtension
 * @author Peter Lofgren Loftux AB
 */

(function()
{
	if (typeof ShareExtras == "undefined" || !ShareExtras)
	{
		ShareExtras = {};
	}
	if (typeof ShareExtras.ViewerExtension == "undefined" || !ShareExtras.ViewerExtension)
	{
		ShareExtras.ViewerExtension = {};
	}

	ShareExtras.ViewerExtension.prototype =
	{
	   /**
	    * Minimum height of the viewer in pixels
	    */
	   viewerMinHeight: 400,
	   
	   /**
	    * Default options which control which elements space is allowed for
	    */
	   viewerSizeOptsDefault:
	   {
	      commentsList: true,
	      commentContent: true,
	      siteNavigation: true,
	      nodeHeader: true,
          filmstrip: true
	   },
	   
		/**
		 * Set up the available preview size
		 * 
		 * @method setupPreviewSize
		 * @param {object} opts  Object containing a set of boolean properties indicating which elements to allow vertical space for. Default is all if not specified.
		 * @return {integer} size in pixels that preview div is set to
		 * @public
		 */
		setupPreviewSize : function WP_setupPreviewSize(opts)
		{
		   opts = YAHOO.lang.merge(this.viewerSizeOptsDefault, opts || {});
			var sourceYuiEl = new YAHOO.util.Element(this.widgets.previewerElement), previewHeight, docHeight = YAHOO.util.Dom.getDocumentHeight(), clientHeight = YAHOO.util.Dom
					.getClientHeight(), elementPresent;
			// Take the smaller of the two
			previewHeight = (docHeight < clientHeight) ? docHeight : clientHeight;

			// see if the comments are loaded
			elementPresent = YAHOO.util.Dom.getElementsByClassName("comments-list");
			if (elementPresent.length > 0 && opts.commentsList)
			{
				// there is a comment section, subtract space for that
				previewHeight = previewHeight - 93; // WA reduce from 108 to 93, includes 'Comments' heading, Add Comment button and HR.
			}
			elementPresent = YAHOO.util.Dom.getElementsByClassName("comment-content");
			if (elementPresent.length > 0 && opts.commentContent)
			{
				// there is a comment, at least allow for some of it to display
				previewHeight = previewHeight - 110;
			}
			elementPresent = YAHOO.util.Dom.getElementsByClassName("site-navigation");
			if (elementPresent.length > 0 && opts.siteNavigation)
			{
				// there is a navigation section, subtract space for that
				previewHeight = previewHeight - 125;
			}
            // New header menu
            elementPresent = YAHOO.util.Dom.getElementsByClassName("alf-header");
            if (elementPresent.length > 0 && opts.siteNavigation)
            {
                // there is a navigation section, subtract space for that
                previewHeight = previewHeight - 125;
            }
			elementPresent = YAHOO.util.Dom.getElementsByClassName("node-header");
			if (elementPresent.length > 0 && opts.nodeHeader)
			{
				// there is a node header section, subtract space for that
				previewHeight = previewHeight - 110;
			}

            elementPresent = YAHOO.util.Dom.getElementsByClassName("alf-filmstrip-nav-buttons");
            if (elementPresent.length > 0 && opts.filmstrip)
            {
                // there is a node header section, subtract space for that
                previewHeight = previewHeight - 220;
            }
			
			previewHeight = Math.max(previewHeight, this.viewerMinHeight);
			
			sourceYuiEl.setStyle("height", previewHeight + "px");

			return previewHeight;

		}

	}

	YAHOO.lang.augmentProto(Alfresco.WebPreview, ShareExtras.ViewerExtension);
})();