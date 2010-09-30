<import resource="classpath:alfresco/site-webscripts/org/alfresco/callutils.js">

if (!json.isNull("wikipage"))
{
   var wikipage = String(json.get("wikipage"));   
   model.pagecontent = getPageText(wikipage);
   model.title = wikipage.replace(/_/g, " ");
}
else
{
   model.pagecontent = "No page is configured";
   model.title = "";
}

function getPageText(wikipage)
{
   var c = sitedata.getComponent(url.templateArgs.componentId);
   c.properties["wikipage"] = wikipage;
   c.save();

   var siteId = String(json.get("siteId"));
   var uri = "/slingshot/wiki/page/" + siteId + "/" + encodeURIComponent(wikipage) + "?format=mediawiki";

   var connector = remote.connect("alfresco");
   var result = connector.get(uri);
   if (result.status == status.STATUS_OK)
   {
      return result.response;
   }
   else
   {
      return "";
   }   
}



