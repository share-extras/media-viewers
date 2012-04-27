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
 * This is the "PdfPlugin" plugin that renders pdf file using third party pdf.js
 * library, or as fallback any pdf viewer plugin installed in the browser
 * 
 * Supports the following mime types: "application/pdf".
 * 
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.Embed
 * @author Peter Lšfgren Loftux AB
 */

Alfresco.WebPreview.prototype.Plugins.Embed = function(wp, attributes)
{
	this.wp = wp;
	this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
	return this;
};

Alfresco.WebPreview.prototype.Plugins.Embed.prototype = {
	/**
	 * Attributes
	 */
	attributes : {

		/**
		 * Decides if the node's content or one of its thumbnails shall be
		 * displayed. Leave it as it is if the node's content shall be used. Set
		 * to a custom thumbnail definition name if the node's thumbnail contains
		 * the thumbnail to display.
		 * 
		 * @property src
		 * @type String
		 * @default null
		 */
		src : null,

		/**
		 * Comma separated string of Windows ActiveX id:s. Used in Internet
		 * Explorer only to test for plugin presence.
		 * 
		 * @property IEactiveX
		 * @type String
		 * @default AcroPDF.PDF,PDF.PdfCtrl,FOXITREADEROCX.FoxitReaderOCXCtrl.1
		 */
		IEactiveX : 'AcroPDF.PDF,PDF.PdfCtrl,FOXITREADEROCX.FoxitReaderOCXCtrl.1',

		/**
		 * Test if a plugin is available. Use for mime types that need a plugin
		 * to display for example application/pdf.
		 * 
		 * @property TestPluginAvailability
		 * @type String
		 * @default "false"
		 */
		TestPluginAvailability : "false"
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
	report : function Embed_report()
	{

		var plugininstalled = false, testPluginAvailability = (this.attributes.TestPluginAvailability && this.attributes.TestPluginAvailability === "true") ? true : false;;

		if (testPluginAvailability === true)
		{

			// IE needs special way of testing for
			if (YAHOO.env.ua.ie > 0)
			{
				plugininstalled = this._detectPluginIE();
			} else
			{
				if (Alfresco.util.isBrowserPluginInstalled(this.wp.options.mimeType))
				{
					plugininstalled = true;
				}
			}

		} else
		{
			plugininstalled = true;
		}

		// If neither is supported, then report this, and bail out as viewer
		if (plugininstalled === false && testPluginAvailability === true)
		{
			return this.wp.msg("label.browserReport", "Missing Plugin ");
		}
	},

	/**
	 * Display the node.
	 * 
	 * @method display
	 * @public
	 */
	display : function Embed_display()
	{
		var url = this.attributes.src ? this.wp.getThumbnailUrl(this.attributes.src) : this.wp.getContentUrl(), displaysource, previewHeight;

		previewHeight = this.wp.setupPreviewSize();

		displaysource = '<div class="iframe-view-controls"><div class="iframe-viewer-button">';
		displaysource += '<a title="View In Browser" class="simple-link" href="' + url;
		displaysource += '" target="_blank" style="background-image:url(' + Alfresco.constants.URL_RESCONTEXT
				+ 'components/documentlibrary/actions/document-view-content-16.png)">';
		displaysource += '<span>' + Alfresco.util.message("actions.document.view") + ' </span></a></div></div>'
		// Set the iframe
		displaysource += '<iframe id="Embed" name="Embed" src="' + url
				+ '" scrolling="yes" marginwidth="0" marginheight="0" frameborder="0" vspace="0" hspace="0"  style="height:' + (previewHeight - 10).toString()
				+ 'px;"></iframe>';

		return displaysource;

	},

	/**
	 * Detect PDF plugin in IE
	 * 
	 * @method _detectPdfPluginIE
	 * @private
	 */
	_detectPluginIE : function Embed_detectPluginIE()
	{

		if (window.ActiveXObject)
		{
			var control = null, activeXIE = this.attributes.IEactiveX.split(','), plugininstalled = false;

			// Loop the ActiveX id collection
			for ( var i = 0, activeXIELength = activeXIE.length; i < activeXIELength; i++)
			{
				try
				{
					// Try to create instance
					control = new ActiveXObject(YAHOO.lang.trim(activeXIE[i]));
				} catch (e)
				{
					// Do nothing
				}

				if (control)
				{
					plugininstalled = true;
					break;
				}
			}
			return plugininstalled;
		}

		return false;
	}
};