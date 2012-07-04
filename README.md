Media Viewers for Alfresco Share
================================

Authors: Will Abson (Alfresco), Peter Löfgren (Loftux AB)

This add-on project for Alfresco Share provides a number of content viewers to 
complement the out-of-the box set supplied with Share. It was previously named
_Media Preview_.

Viewers can be configured into the Web Preview component of the Document
Details Page. In addition, the add-on supplies a custom dashlet which can be
used to display any chosen document or content item on a site dashboard.

The following viewers are supplied in the v2.x add-on for use on Alfresco 4

* **PdfJs** displays documents, presentations and any other file capable of being 
  transformed to PDF in-line in the web browser using the excellent [pdf.js](http://mozilla.github.com/pdf.js/)
  viewer, which uses the power of HTML5 to remove Share's Flash dependency for 
  document viewing.
  
  The viewer supports a number of features not directly supported by the Flash
  document previewer, such as a sidebar with thumbnail, outline and search views, 
  bookmarking of individual pages of a document, and will remember the page 
  number and zoom level of previous documents that you have viewed.
  
  ![PdfJs Viewer](http://sharextras.org/trunk/Media%20Preview/screenshots/pdfjs-doc.png)

* **FLVPlayer** and **MP3Player** display compatible audio and video files respectively, within the web-browser using the 
  open source [FLV Player](http://flv-player.net/) and [MP3 Player](http://flash-mp3-player.net/) media players by [neolao](http://www.neolao.com/). Based on the 
  content's MIME type, the updated component automatically chooses the appropriate 
  previewer to use.
  
  While similar to the Flash players provided by Share out-of-the-box, these 
  implementations allow advanced customization of the player via configuration and
  if [FFmpeg](http://ffmpeg.org/) is installed, will fire up a transformation to allow viewing 
  of non-H264/FLV video and non-MP3 audio. The user is informed when conversion
  is in progress and the screen automatically updates when the content can
  be viewed.
  
* **Embed** uses an in-line iFrame to embed the content itself directly inside the
  web page. It is suitable for use with content types that can be viewed 
  directly within the web browser such as plain text and PDF, with the Chrome
  or Acrobat plugins installed. Again, this can be used to avoid the use of 
  the Flash previewer for some clients.

* **Prettify** allows formatted code, mark-up and other supported text formats
  to be displayed in directly in the document and uses the [google-code-prettify](https://code.google.com/p/google-code-prettify/)
  project to provide an in-line browser-based view with syntax highlighting.
  
  ![Prettify Viewer](http://sharextras.org/trunk/Media%20Preview/screenshots/prettify-js.png)

* **WebODF** is an EXPERIMENTAL viewer which uses the AGPL-licensed [WebODF](http://www.webodf.org/) 
  project to display ODF content directly in the web browser.
  
  WebODF cannot be distributed with the add-in itself, so in order to use it you must also
  download the latest JAR file from the supporting [share-webodf project](https://github.com/wabson/webodf-share/downloads) and
  install it in the same way as the main media-viewers JAR file.
  
The v0.x/1.x add-on supplies only the FLVPlayer and MP3Player add-ons and works on Alfresco 3.3/3.4.

In addition to the Share component extensions the add-on supplies repository extension configuration
for defining 'thumbnailed' content in PDF, H264/FLV and MP3 formats, a full-size image thumbnail for 
video files in JPEG format, and a transformer based on FFmpeg for generating the audio and video formats.

Download
--------

For Alfresco 4.x, download the 2.0 version of Media Viewers.

[Download Media Viewers add-on](http://code.google.com/p/share-extras/downloads/list?q=media-viewers)

For Alfresco 3.x, download the 0.x or 1.0 version of Media Preview.

[Download Media Previews add-on](http://code.google.com/p/share-extras/downloads/list?q=media-preview)

Installation
------------

Copy the JAR file into the `tomcat/shared/lib` folder of your Alfresco installation. If you are hosting
the repository and Share in different Tomcat containers then you should install it in both.

See _Configuration_ below, for instructions on how to enable the viewers in Share.

### FFmpeg Installation (optional)

The supplied Spring configuration extends the repository thumbnailing capabilities to support 
H264/FLV thumbnails for video content and MP3 thumbnails for audio content, both
using FFmpeg, and PDF thumbnails for content such as Microsoft Word and Powerpoint
files. PDF thumbnails can be generated using the default repository transformers,
but a custom transformer is supplied to enable the FFmpeg transformations.

The previews therefore do not require FFmpeg, but it is highly recommended to
support the widest range of formats, and for thumbnail image generation.

To enable FFmpeg support you must

1. Install FFmpeg (with [x264](http://www.videolan.org/developers/x264.html)) on the server
   
   It is unlikely that your standard package manager will install this for you. The 
   [FFmpeg documentation](https://ffmpeg.org/trac/ffmpeg/wiki) does however contain detailed documentation for compiling on
   [Ubuntu](https://ffmpeg.org/trac/ffmpeg/wiki/UbuntuCompilationGuide) and [other operating systems](https://ffmpeg.org/trac/ffmpeg/wiki/CompilationGuide)
   and the project also makes pre-built binaries available for [download](http://ffmpeg.org/download.html).
   
2. Edit your `alfresco-global.properties` file to define the location
   of the FFmpeg executable and base directory (should not contain spaces)

        ffmpeg.exe=<location of ffmpeg executable>
   
   The path should not contain spaces, and if you are on Windows you should use
   forward slashes rather than backslashes as your directory separator, or use
   double-backslashes to escape them.

If you are running Alfresco and Share in the same application server then the 
JAR file also contains the required repository configuration, but if these are
in separate containers then you will need to install it into both.

Check the `alfresco.log` file while the repository is starting up for any 
warnings or errors related to FFmpeg, if you have enabled it.

Building from Source
--------------------

The add-on has been developed to install on top of an existing Alfresco 4.0 or
3.3/3.4 installation.

An Ant build script is provided to build a JAR file containing the 
custom files, which can then be installed into the `tomcat/shared/lib` folder 
of your Alfresco installation.

To build the JAR file, run the following command from the base project 
directory.

    ant -f project.xml dist-jar

Or, for the 0.x/1.0 release

    ant dist-jar

The command should build a JAR file named `media-viewers-{version}.jar`
in the `dist` directory within your project.

To deploy the add-on files into a local Tomcat instance for testing, you can 
use the `hotcopy-tomcat-jar` task. You will need to set the `tomcat.home`
property in Ant.

    ant -Dtomcat.home=C:/Alfresco/tomcat clean hotcopy-tomcat-jar

After you have deployed the JAR file you will need to restart Tomcat to ensure 
it picks up the changes.

Configuration
-------------

After installing the add-on in Alfresco 4, you must then configure the `web-preview.get`
component to use the particular viewers that you wish to enable. To do this, you must

1. Copy the file `WEB-INF/classes/alfresco/site-webscripts/org/alfresco/components/preview/web-preview.get.config.xml` 
   from the exploded Alfresco webapp into the directory `alfresco/web-extension/site-webscripts/org/alfresco/components/preview`
   under your `tomcat/shared/classes`. You will need to create the new directories if you have not done this previously.

2. Modify that file to add in the new viewers as needed

An in-depth discussion of the redesigned `web-preview` component in Alfresco 4 is provided on 
[Will's blog](http://blogs.alfresco.com/wp/wabson/2012/04/11/share-document-previews-in-alfresco-4/),
where the configuration mechanism is explained. 
Or, you can re-use the example configuration below and comment out any parts that you don't want.

No additional configuration is required for the 0.x/1.x version of the add-on in
Alfresco 3.

###Sample Configuration

    <config>
    
       <!--
          List of rule to decide which plugin that shall be used to preview the node's content or thumbnails.
          The list is evaluated from the top.
          All attributes for a condition must match.
          When a condition matches the nodes' mimeType and/or thumbails its list of plugins are tested from the top.
          Every plugin will be created and get an opportunity to decide if it may be used in the users browser environment.
          If the plugin can't be used it will give a report back to the user that will be displayed if neither of the
          plugins in the list can be used.
       -->
    
       <plugin-conditions>
    
          <!--
              Enables the PdfJs viewer for all PDF documents or Embed in older browsers
              
              The PdfJs <plugin> element supports the following attributes to further control the viewer
              
                * src="value"    Name of the thumbnail to display, which should be a PDF (default null, forces the cm:content property to be used)
                * skipbrowsertest="true|false"    Skipbrowser test, mostly for developer to force test loading (default "false")
                * mode="iframe|block" Display mode. "block" is the normal Share view, "iframe" uses the pdf.js viewer in an iframe (deprecated, default "block")
                * defaultScale="page-width|two-page-width|page-height|page-fit|two-page-fit|auto|value" Default zoom level for new documents, either a predefined string (for auto-calculation) or a decimal number between 0 and 1 (default "two-page-fit")
                * scaleDelta="value"   Multipler for zooming in/out, should be a decimal > 1 (default "1.1")
                * pageLayout="single|multi"   Layout to use to display pages, "single" (one page per row) or "multi" (multiple pages per row) (default "multi")
                * disableTextLayer="true|false"   Whether text overlays on pages should be disabled. Overlays allow users to select text content in their browser but reduce rendering performance (default "false")
                * useLocalStorage="true|false"   Whether to use HTML5 browser storage to persist the page number and zoom level of previously-viewed documents (default "true")
              
              The Embed <plugin> element supports the following attributes
              
                * src="value"    Name of the thumbnail to display (default null, forces the cm:content property to be used)
                * ieActiveX="true|false"   Comma separated string of Windows ActiveX id:s. Used in Internet Explorer only to test for plugin presence. (default "AcroPDF.PDF,PDF.PdfCtrl,FOXITREADEROCX.FoxitReaderOCXCtrl.1")
                * testPluginAvailability="true|false" Test if a plugin is available. Use for mime types that need a plugin to display for example application/pdf (default "false")
          -->
          <condition mimeType="application/pdf">
             <plugin>PdfJs</plugin>
             <plugin>Embed</plugin>
          </condition>
          
          <!--
              Enables the PdfJs viewer for other content which can be transformed to PDF or Embed 
              in older browsers.
              
              Note, the OpenOffice transformer must be available on the server for this to work.
          -->
          <condition thumbnail="pdf">
             <plugin src="pdf">PdfJs</plugin>
             <plugin src="pdf">Embed</plugin>
          </condition>
          
          <!--
              Enables the FLVPlayer viewer for video formats natively-supported by Flash
              
              The <plugin> element supports the following attributes to further control the viewer
              
                * poster="value"    Name of the static image thumbnail to display before displaying the video (default "imgpreviewfull")
                * queueMissingRenditions="true|false"    Whether the player should attempt to queue the generation of missing video thumbnails (default "true")
                * autoplay="true|false" Whether to auto-play the video (default "false")
                * autoload="true|false" Whether to auto-load the video (default "true")
                * playercolor="value"   Color of the player in hex notation, without the initial '#' (default "e1e3e5")
                * buttoncolor="value"   Color of the player button icons in hex notation (default "000000")
                * buttonovercolor="value"   Hover color of the player buttons in hex notation (default "0088de")
                * sliderovercolor="value"   Hover color of the player slider in hex notation (default "0088de")
                * showfullscreen="true|false"   Whether to show the full screen button (default "true")
                * showiconplay="true|false"   Whether to show the play button (default "true")
                * showvolume="true|false"   Whether to show the volume control (default "true")
                * showtime="true|false"   Whether to show the elapsed time in the player (default "true")
                * playermargin="value"   Margin in pixels around the player (default "0")
          -->
          <condition mimeType="video/mp4">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/m4v">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/x-flv">
             <plugin>FLVPlayer</plugin>
          </condition>
          
          <!--
              Enables the FLVPlayer viewer for other common video formats. This requires FFmpeg support.
          -->
          <condition mimeType="video/mpeg2" thumbnail="h264preview">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/quicktime" thumbnail="h264preview">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/ogg" thumbnail="h264preview">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/x-msvideo" thumbnail="h264preview">
             <plugin>FLVPlayer</plugin>
          </condition>
          <condition mimeType="video/webm" thumbnail="h264preview">
             <plugin>FLVPlayer</plugin>
          </condition>
          
          <!--
              Enables the MP3Player viewer for audio formats natively-supported by Flash
          -->
          <condition mimeType="audio/mpeg">
             <plugin>MP3Player</plugin>
          </condition>
          
          <!--
              Enables the MP3Player viewer for other common audio formats. This requires FFmpeg support.
              
              The <plugin> element supports the following attributes to further control the viewer
              
                * mp3ThumbnailName="value"    Name of the audio thumbnail to look in for MP3 audio content for non-MP3 files (default "mp3thumbnail")
                * queueMissingRenditions="true|false"    Whether the player should attempt to queue the generation of missing audio thumbnails (default "true")
                * autoplay="true|false" Whether to auto-play the audio (default "false")
                * autoload="true|false" Whether to auto-load the audio (default "true")
          -->
          <condition mimeType="audio/x-wav" thumbnail="mp3preview">
             <plugin>MP3Player</plugin>
          </condition>
          <condition mimeType="audio/x-flac" thumbnail="mp3preview">
             <plugin>MP3Player</plugin>
          </condition>
          <condition mimeType="audio/vorbis" thumbnail="mp3preview">
             <plugin>MP3Player</plugin>
          </condition>
          <condition mimeType="audio/ogg" thumbnail="mp3preview">
             <plugin>MP3Player</plugin>
          </condition>
          <condition mimeType="audio/x-ms-wma" thumbnail="mp3preview">
             <plugin>MP3Player</plugin>
          </condition>
          
          <!--
              Enables the Prettify viewer for JavaScript files using language auto-detection
              and for CSS files setting the type explictly (see list in prettify's README)
          -->
          <condition mimeType="application/x-javascript">
             <plugin>Prettify</plugin>
          </condition>
          <condition mimeType="text/css">
             <plugin lang="lang-css">Prettify</plugin>
          </condition>
    
          <!--
              Enables the EXPERIMENTAL WebODF viewer for Open Document text files
          -->
          <condition mimeType="application/vnd.oasis.opendocument.text">
             <plugin>WebODF</plugin>
          </condition>
          
          <!-- DEFAULT SHARE CONFIGURATION BELOW THIS LINE -->
    
          <!-- Video with posters -->
    
          <condition mimeType="video/mp4" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">StrobeMediaPlayback</plugin>
             <plugin poster="imgpreview" posterFileSuffix=".png">FlashFox</plugin>
             <plugin poster="imgpreview" posterFileSuffix=".png">Video</plugin>
          </condition>
    
          <condition mimeType="video/m4v" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">StrobeMediaPlayback</plugin>
             <plugin poster="imgpreview" posterFileSuffix=".png">FlashFox</plugin>
             <plugin poster="imgpreview" posterFileSuffix=".png">Video</plugin>
          </condition>
    
          <condition mimeType="video/x-flv" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">StrobeMediaPlayback</plugin>
             <plugin poster="imgpreview" posterFileSuffix=".png">FlashFox</plugin>
          </condition>
    
          <condition mimeType="video/quicktime" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">StrobeMediaPlayback</plugin>
          </condition>
    
          <condition mimeType="video/ogg" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">Video</plugin>
          </condition>
    
          <condition mimeType="video/webm" thumbnail="imgpreview">
             <plugin poster="imgpreview" posterFileSuffix=".png">Video</plugin>
          </condition>
    
          <!-- Video without posters -->
    
          <condition mimeType="video/mp4">
             <plugin>StrobeMediaPlayback</plugin>
             <plugin>FlashFox</plugin>
             <plugin>Video</plugin>
          </condition>
    
          <condition mimeType="video/x-m4v">
             <plugin>StrobeMediaPlayback</plugin>
             <plugin>FlashFox</plugin>
             <plugin>Video</plugin>
          </condition>
          <condition mimeType="video/x-flv">
             <plugin>StrobeMediaPlayback</plugin>
             <plugin>FlashFox</plugin>
          </condition>
    
          <condition mimeType="video/quicktime">
             <plugin>StrobeMediaPlayback</plugin>
          </condition>
    
          <condition mimeType="video/ogg">
             <plugin>Video</plugin>
          </condition>
    
          <condition mimeType="video/webm">
             <plugin>Video</plugin>
          </condition>
    
          <!-- Audio -->
          <condition mimeType="audio/mpeg">
             <plugin>StrobeMediaPlayback</plugin>
             <plugin>FlashFox</plugin>
             <plugin>Audio</plugin>
          </condition>
    
          <condition mimeType="audio/x-wav">
             <plugin>Audio</plugin>
          </condition>
    
          <!-- Documents that has been converted to .swf -->
    
          <condition thumbnail="webpreview">
             <plugin src="webpreview" paging="true">WebPreviewer</plugin>
          </condition>
    
          <!-- Content that has an image preview thumbnail -->
    
          <condition thumbnail="imgpreview">
             <plugin src="imgpreview">Image</plugin>
          </condition>
    
          <!-- Images in real size (if they didn't have a imgpreview) -->
    
          <condition mimeType="image/jpeg">
             <plugin srcMaxSize="500000">Image</plugin>
          </condition>
    
          <condition mimeType="image/png">
             <plugin srcMaxSize="500000">Image</plugin>
          </condition>
    
          <condition mimeType="image/gif">
             <plugin srcMaxSize="500000">Image</plugin>
          </condition>
    
          <condition mimeType="application/x-shockwave-flash">
             <plugin>Flash</plugin>
          </condition>
    
          <!-- To add zooming capabilities for images place the following inside a <condition> element -->
          <!-- <plugin>WebPreviewer</plugin> -->
    
       </plugin-conditions>
    
    </config>

Lastly you must enable the relevant modules in the Share Module Deployment console, after Alfresco
has started up. You can access this page from the main Web Scripts index page.

Usage
-----

Upload a supported file type to Alfresco Share and navigate to the Document Details page to 
see the preview.

To use the Document Viewer dashlet, navigate to a site dashboard. Then, click the 
_Customize Dashboard_ button to edit the contents of the dashboard and drag 
the dashlet into one of the columns from the list of dashlets.

Troubleshooting
---------------

###Web Previews

The most common problem that you may see when using the viewers is that the text _Preparing Previewer..._ is shown on the screen. This is usually
accompanied by an error in the browser JavaScript console indicating that the plugin instance could not be created.

If you see this on your system, check that the add-on is installed correctly and that you have enabled the relevant viewers
in the Module Deployment console.

###FFmpeg

If you have problems with audio and video previews or thumbnails not working, first check your `alfresco.log` for any errors being thrown at startup, relating to FFmpeg. 
If no errors are shown, you can force the transformers to give you a little more information by adding the 
following lines to the file `webapps/alfresco/WEB-INF/classes/log4j.properties`.

    log4j.logger.org.alfresco.util.exec.RuntimeExec=debug
    log4j.logger.org.alfresco.repo.content.transform=debug
    log4j.logger.org.alfresco.repo.thumbnail=debug

If no problems are obvious and you _still_ find that thumbnails do not get generated or the player does not render, 
you can make a direct request for the specific renditions to help diagnose the problem. In the URLs below you 
will need to replace the `{nodeId}` token with the GUID of the problematic file (which you can grab from the end of 
the Document Details page URL), and substitute in the hostname of your server in place of `{hostname}`.

 * For thumbnail problems, hit [http://{hostname}/share/proxy/alfresco/api/node/workspace/SpacesStore/{nodeId}/content/thumbnails/doclib?c=force](http://{hostname}/share/proxy/alfresco/api/node/workspace/SpacesStore/{nodeId}/content/thumbnails/doclib?c=force)
 * For player problems, hit [http://{hostname}/share/proxy/alfresco/api/node/workspace/SpacesStore/{nodeId}/content/thumbnails/h264preview?c=force](http://{hostname}/share/proxy/alfresco/api/node/workspace/SpacesStore/{nodeId}/content/thumbnails/h264preview?c=force)

This should force the thumbnails to be generated syncronously, and a stack trace will be visible in the page response or in `alfresco.log`.

Known Issues
------------

* Chrome on Windows does not correctly render PDF documents converted via OpenOffice, when using the PdfJs 
  viewer. This is due to a [Chrome bug](http://code.google.com/p/chromium/issues/detail?id=122465). The viewer therefore tests for this combination of browser and operating 
  system and declines to display the content. Fortunately the Embed viewer is able to render the content
  via Chrome's built-in PDF support.

* In versions 3.3, 3.4.a, 3.4.b and 3.4.c, the video player only supports previews of MP4 and FLV content, due to 
  a bug whereby the thumbnail service [cannot produce renditions using a RuntimeExec transformer](https://issues.alfresco.com/jira/browse/ALF-4214). 
  The workaround for this is to apply the fix in the JIRA issue to patch your 
  own `alfresco-repository.jar`. This is fixed in version 3.4.d.

* Prior to Alfresco Community 3.4.b, adding the additional thumbnail definitions to the thumbnail registry required 
  overriding the entire thumbnailRegistry bean. The supplied Spring configuration still uses this old method for now 
  in order to support the widest range of versions, but if this causes you problems you can use the new 
  `org.alfresco.repo.thumbnail.ThumbnailDefinitionSpringRegistrer` bean instead 
  ([example config](http://fisheye.alfresco.com/browse/alfresco_open_mirror/alfresco/HEAD/root/projects/repository/config/alfresco/extension/video-transformation-context.xml.sample?r=22817))
