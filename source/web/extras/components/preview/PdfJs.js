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
 * This is the "PdfJs" plugin that renders pdf file using third party pdf.js
 * library, or as fallback any pdf viewer plugin installed in the browser
 * 
 * Supports the following mime types: "application/pdf".
 * 
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.PdfJs
 * @author Peter Lšfgren Loftux AB
 */

Alfresco.WebPreview.prototype.Plugins.PdfJs = function(wp, attributes)
{
	this.wp = wp;
	this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
	return this;
};

Alfresco.WebPreview.prototype.Plugins.PdfJs.prototype = {
	/**
	 * Attributes
	 */
	attributes : {

		/**
		 * Decides if the node's content or one of its thumbnails shall be
		 * displayed. Leave it as it is if the node's content shall be used. Set
		 * to a custom thumbnail definition name if the node's thumbnail contains
		 * the PdfJs to display.
		 * 
		 * @property src
		 * @type String
		 * @default null
		 */
		src : null,

		/**
		 * Skipbrowser test, mostly for developer to force test loading Valid
		 * options "true" "false" as String
		 * 
		 * @property skipbrowsertest
		 * @type String
		 * @default "false"
		 */
		skipbrowsertest : "false"
	},

	/**
	 * Tests if the plugin can be used in the users browser.
	 * 
	 * @method report
	 * @return {String} Returns nothing if the plugin may be used, otherwise
	 *         returns a message containing the reason it cant be used as a
	 *         string.
	 * @public
	 */
	report : function PdfJs_report()
	{
		var canvassupport = false, skipbrowsertest = (this.attributes.skipbrowsertest && this.attributes.skipbrowsertest === "true") ? true : false;

		if (skipbrowsertest === false)
		{
			// Test if canvas is supported
			if (window.HTMLCanvasElement)
			{
				canvassupport = true;
				// Do some engine test as well, some support canvas but not the
				// rest for full html5
				if (YAHOO.env.ua.webkit > 0 && YAHOO.env.ua.webkit < 534)
				{
					// http://en.wikipedia.org/wiki/Google_Chrome
					// Guessing for the same for safari
					canvassupport = false;
				}
				if (YAHOO.env.ua.ie > 0 && YAHOO.env.ua.ie < 9)
				{
					canvassupport = false;
				}
				if (YAHOO.env.ua.gecko > 0 && YAHOO.env.ua.gecko < 5)
				{
					// http://en.wikipedia.org/wiki/Gecko_(layout_engine)
					canvassupport = false;
				}
			}

		} else
		{
			canvassupport = true;
		}

		// If neither is supported, then report this, and bail out as viewer
		if (canvassupport === false && skipbrowsertest === false)
		{
			return this.wp.msg("label.browserReport", "&lt;canvas&gt; missing");
		}
	},

	/**
	 * Display the node.
	 * 
	 * @method display
	 * @public
	 */
	display : function PdfJs_display()
	{
		var fileurl, displaysource, previewHeight;

		previewHeight = this.wp.setupPreviewSize();

		if (this.attributes.src)
		{
			// We do not use the built in function to get url, since pdf.js will
			// strip
			// attributes from the url. Instead we add it back in pdfviewer.js
			fileurl = Alfresco.constants.PROXY_URI + "api/node/" + this.wp.options.nodeRef.replace(":/", "") + "/content/thumbnails/pdf/" + this.wp.options.name
					+ '.pdf';
		} else
		{
			fileurl = this.wp.getContentUrl();
		}

		// html5 is supported, display with pdf.js
		// id and name needs to be equal, easier if you need scripting access
		// to iframe
		displaysource = '<iframe id="PdfJs" name="PdfJs" src="' + Alfresco.constants.URL_SERVICECONTEXT + 'extras/components/preview/pdfviewer?htmlid=' + encodeURIComponent('blah') + '&file=' + encodeURIComponent(fileurl)
				+ '" scrolling="yes" marginwidth="0" marginheight="0" frameborder="0" vspace="5" hspace="5"  style="height:' + (previewHeight - 10).toString()
				+ 'px;"></iframe>';

		return displaysource;

	}
};