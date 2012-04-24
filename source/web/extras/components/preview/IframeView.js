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
 * This is the "IframeView" plug-in used to display file formats such as
 * text and html that can render directly in the web browser.
 *
 * @namespace Alfresco.WebPreview.prototype.Plugins
 * @class Alfresco.WebPreview.prototype.Plugins.IframeView
 * @author Peter Lšfgren Loftux AB
 */

Alfresco.WebPreview.prototype.Plugins.IframeView = function(wp, attributes)
{
	this.wp = wp;
	this.attributes = YAHOO.lang.merge(Alfresco.util.deepCopy(this.attributes), attributes);
	return this;
};

Alfresco.WebPreview.prototype.Plugins.IframeView.prototype = {
	/**
	 * Attributes
	 */
	attributes : {
		/**
		 * Decides if the node's content or one of its thumbnails shall be
		 * displayed. Leave it as it is if the node's content shall be used. Set
		 * to a custom thumbnail definition name if the node's thumbnail contains
		 * the IframeView to display.
		 * 
		 * @property src
		 * @type String
		 * @default null
		 */
		src : null,
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
	report : function IframeView_report()
	{
		// Report nothing since all browsers support the <iframe> element
		// ....well maybe not ascii browsers :-)
	},

	/**
	 * Display the node using in iframe.
	 * 
	 * @method display
	 * @public
	 */
	display : function IframeView_display()
	{
		var src = this.wp.getContentUrl(), displaysrc, previewHeight;

		previewHeight = this.wp.setupPreviewSize();

		displaysrc = '<div class="iframe-view-controls"><div class="iframe-viewer-button">';
		displaysrc += '<a title="View In Browser" class="simple-link" href="' + src;
		displaysrc += '" target="_blank" style="background-image:url(' + Alfresco.constants.URL_RESCONTEXT
				+ 'components/documentlibrary/actions/document-view-content-16.png)">';
		displaysrc += '<span>' + Alfresco.util.message("actions.document.view") + ' </span></a></div></div>'
		// Set the iframe
		displaysrc += '<iframe id="IframeView" src="' + src
				+ '" scrolling="yes" marginwidth="0" marginheight="0" frameborder="0" vspace="5" hspace="5" style="height:' + (previewHeight - 10).toString()
				+ 'px;"></iframe>';
		return displaysrc;
	}
};