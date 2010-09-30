/**
 * Copyright (C) 2005-2008 Alfresco Software Limited.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

 * As a special exception to the terms and conditions of version 2.0 of 
 * the GPL, you may redistribute this Program in connection with Free/Libre 
 * and Open Source Software ("FLOSS") applications as described in Alfresco's 
 * FLOSS exception.  You should have recieved a copy of the text describing 
 * the FLOSS exception, and it is also available here: 
 * http://www.alfresco.com/legal/licensing
 */
 
/**
 * Alfresco.dashlet.VideoWidget
 *
 * Displays a user-selected video file on a user's dashboard
 *
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * VideoWidget constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.VideoWidget} The new VideoWidget instance
    * @constructor
    */
   Alfresco.dashlet.VideoWidget = function(htmlId)
   {
      Alfresco.dashlet.VideoWidget.superclass.constructor.call(this, "Alfresco.dashlet.VideoWidget", htmlId, ["button", "container", "datatable", "datasource", "treeview"]);
      
      // Initialise prototype properties
      this.configDialog = null;
      
      return this;
   };

   YAHOO.extend(Alfresco.dashlet.VideoWidget, Alfresco.component.Base,
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
          * The component id
          *
          * @property componentId
          * @type string
          * @default ""
          */
         componentId: "",

         /**
          * The nodeRef to the video to display
          *
          * @property nodeRef
          * @type string
          * @default ""
          */
         nodeRef: "",

         /**
          * The name of the configured content item
          *
          * @property name
          * @type string
          * @default ""
          */
         name: "",

         /**
          * The title property of the configured content item
          *
          * @property title
          * @type string
          * @default ""
          */
         title: "",

         /**
          * The siteId of the current site
          *
          * @property site
          * @type string
          * @default ""
          */
         site: ""
      },
      
      /**
       * Configuration dialog instance
       *
       * @property configDialog
       * @type object
       */
      configDialog: null,
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function RF_onReady()
      {
         // Add click handler to config feed link that will be visible if user is site manager.
         var configVideoLink = Dom.get(this.id + "-configVideo-link");
         if (configVideoLink)
         {
            Event.addListener(configVideoLink, "click", this.onConfigVideoClick, this, true);            
         }
         
         if (this.options.nodeRef != null && this.options.nodeRef != "")
         {
            Dom.get(this.id + "-preview").style.display = "block";
            
            // Unfortunately this seems to render the Flash movie below the shadow div
            /*
            new Alfresco.VideoPreview(this.id + "-preview").setOptions(
            {
               nodeRef: this.options.nodeRef,
               name: "",
               icon: "",
               mimeType: "video/mp4",
               previews: [ "h264preview", "imgpreview", "imgpreviewfull" ],
               availablePreviews: [ "h264preview", "imgpreview", "imgpreviewfull" ],
               size: "78843"
            }).setMessages(
                  Alfresco.messages.scope[this.name]
             );
             */
         }
         else
         {
            Dom.get(this.id + "-msg").innerHTML = this.msg("message.noVideo");
            Dom.get(this.id + "-msg").style.display = "block";
         }
      },

      /**
       * Called when the user clicks the configure video link.
       * Will open a video config dialog
       *
       * @method onConfigFeedClick
       * @param e The click event
       */
      onConfigVideoClick: function RF_onConfigVideoClick(e)
      {
         var actionUrl = Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId);
         
         Event.stopEvent(e);
         
         if (!this.configDialog)
         {
            this.configDialog = new Alfresco.module.SimpleDialog(this.id + "-configDialog").setOptions(
            {
               width: "50em",
               templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/video/config", actionUrl: actionUrl,
               site: this.options.site,
               nodeName: this.options.name,
               nodeRef: this.options.nodeRef,
               onSuccess:
               {
                  fn: function VideoWidget_onConfigFeed_callback(response)
                  {
                  },
                  scope: this
               },
               doSetupFormsValidation:
               {
                  fn: function VideoWidget_doSetupForm_callback(form)
                  {
                     Dom.get(this.configDialog.id + "-nodeRef").value = this.configDialog.options.nodeRef;
                     Dom.get(this.configDialog.id + "-video").innerHTML = this.configDialog.options.nodeName;
                     
                     var browseButton = Alfresco.util.createYUIButton(this.configDialog, "browse-button", function()
                     {
                        if (!this.browsePanel) 
                        {
                           this.hide();
                           Alfresco.util.Ajax.request(
                           {
                              url: Alfresco.constants.URL_SERVICECONTEXT + "modules/video/browse-file",
                              dataObj: 
                              {
                                 site: this.options.site
                              },
                              successCallback: 
                              {
                                 fn: function(response)
                                 {
                                    var containerDiv = document.createElement("div");
                                    containerDiv.innerHTML = response.serverResponse.responseText;
                                    var panelDiv = Dom.getFirstChild(containerDiv);
                                    this.browsePanel = Alfresco.util.createYUIPanel(panelDiv);
                                    var parentDialog = this;
                                    var selectedDocName = "",
                                       selectedNodeRef = Dom.get(parentDialog.id + "-nodeRef").value;
                                    
                                    var ok = Alfresco.util.createYUIButton(this.browsePanel, "ok", function()
                                    {
                                       parentDialog.options.nodeRef = selectedNodeRef;
                                       parentDialog.options.nodeName = selectedDocName;
                                       
                                       parentDialog.browsePanel.hide();
                                       parentDialog.show();
                                    });
                                    ok.set("disabled", true);
                                    
                                    Alfresco.util.createYUIButton(this.browsePanel, "cancel", function()
                                    {
                                       parentDialog.browsePanel.hide();
                                       parentDialog.show();
                                    });
                                    
                                    Alfresco.util.createTwister("twister");
                                    var tree = new YAHOO.widget.TreeView("treeview");
                                    tree.setDynamicLoad(function(node, fnLoadComplete)
                                    {
                                       var nodePath = node.data.path;
                                       var uri = Alfresco.constants.PROXY_URI + "slingshot/doclib/doc-treenode/site/" + $combine(encodeURIComponent(parentDialog.options.site), encodeURIComponent("documentLibrary"), Alfresco.util.encodeURIPath(nodePath), "?mimetype=video/");
                                       var callback = 
                                       {
                                          success: function(oResponse)
                                          {
                                             var results = YAHOO.lang.JSON.parse(oResponse.responseText), item, treeNode;
                                             if (results.items) 
                                             {
                                                for (var i = 0, j = results.items.length; i < j; i++) 
                                                {
                                                   item = results.items[i];
                                                   item.path = $combine(nodePath, item.name);
                                                   treeNode = _buildTreeNode(item, node, false);
                                                   if (!item.hasChildren || item.type == "cm:content") 
                                                   {
                                                      treeNode.isLeaf = true;
                                                   }
                                                   if (item.type == "cm:content")
                                                   {
                                                      treeNode.hasIcon = false;
                                                      treeNode.enableHighlight = true;
                                                      treeNode.labelStyle = "icon-gen";
                                                   }
                                                }
                                             }
                                             oResponse.argument.fnLoadComplete();
                                          },
                                          
                                          failure: function(oResponse)
                                          {
                                             Alfresco.logger.error("", oResponse);
                                          },
                                          
                                          argument: 
                                          {
                                             "node": node,
                                             "fnLoadComplete": fnLoadComplete
                                          },
                                          
                                          scope: this
                                       };
                                       
                                       YAHOO.util.Connect.asyncRequest('GET', uri, callback);
                                    });
                                    
                                    tree.subscribe("clickEvent", function(args)
                                    {
                                       if (args.node.data.nodeType == "cm:content")
                                       {
                                          selectedNodeRef = args.node.data.nodeRef;
                                          selectedDocName = args.node.label;
                                          args.node.highlight();
                                          ok.set("disabled", false);
                                       }
                                    });
                                    
                                    tree.singleNodeHighlight = true;
                                    
                                    tree.subscribe("collapseComplete", function(node)
                                    {
                                       // Do nothing
                                    });
                                    
                                    var tempNode = _buildTreeNode(
                                    {
                                       name: "documentLibrary",
                                       path: "/",
                                       nodeRef: ""
                                    }, tree.getRoot(), false);
                                    
                                    tree.render();
                                    this.browsePanel.show();
                                 },
                                 scope: this
                              },
                              failureMessage: "Could not load dialog template from '" + Alfresco.constants.URL_SERVICECONTEXT + "modules/video/browse-file" + "'.",
                              scope: this,
                              execScripts: true
                           });
                        }
                        else 
                        {
                           this.hide();
                           this.browsePanel.show();
                        }
                     });
                  },
                  scope: this
               }
            });
         }
         else
         {
            this.configDialog.setOptions(
            {
               actionUrl: actionUrl,
               nodeName: this.options.name,
               nodeRef: this.options.nodeRef
            });
         }
         this.configDialog.show();
      }
   });

})();

/**
 * Alfresco Slingshot aliases
 */
var $html = Alfresco.util.encodeHTML,
   $combine = Alfresco.util.combinePaths;

/**
 * Build a tree node using passed-in data
 *
 * @method _buildTreeNode
 * @param p_oData {object} Object literal containing required data for new node
 * @param p_oParent {object} Optional parent node
 * @param p_expanded {object} Optional expanded/collaped state flag
 * @return {YAHOO.widget.TextNode} The new tree node
*/
function _buildTreeNode(p_oData, p_oParent, p_expanded)
{
   return new YAHOO.widget.TextNode(
   {
      label: $html(p_oData.name),
      path: p_oData.path,
      nodeRef: p_oData.nodeRef,
      nodeType: p_oData.type,
      description: p_oData.description
   }, p_oParent, p_expanded);
}