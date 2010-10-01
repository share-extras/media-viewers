Media Previews for Alfresco Share
=================================

Author: Will Abson

This add-on project for Alfresco Share provides the ability to preview audio 
and video files within the Share user interface.

Specifically the project provides enhancements to the web preview component to 
support Flash-based previews of audio and video content. The supplied 
configuration extends the repository thumbnailing capabilities to support 
H264/FLV thumbnails for video content and MP3 thumbnails for audio content,
using FFmpeg.

The previews therefore do not require FFmpeg, but it is highly recommended to
support the widest range of formats, and for thumbnail image generation.

In addition to support for the additional media types in the Share Document
Details screen, a custom site dashlet is provided, which can be configured 
to display a chosen video.

Installation
------------

The dashlet has been developed to install on top of an existing Alfresco
3.3 installation.

An Ant build script is provided to build a JAR file containing the 
custom files, which can then be installed into the 'tomcat/shared/lib' folder 
of your Alfresco installation.

To build the JAR file, run the following command from the base project 
directory.

    ant clean dist-jar

The command should build a JAR file named share-media-preview.jar
in the 'dist' directory within your project.

To deploy the dashlet files into a local Tomcat instance for testing, you can 
use the hotcopy-tomcat-jar task. You will need to set the tomcat.home
property in Ant.

    ant -Dtomcat.home=C:/Alfresco/tomcat clean hotcopy-tomcat-jar

To enable FFmpeg support you must

  1) Install FFmpeg (with x264) on the server
  2) Edit your alfresco-global.properties file to define the location
     of the FFmpeg executable and base directory (should not contain spaces)
        ffmpeg.exe=<location of ffmpeg executable>
        ffmpeg.base=<location of ffmpeg base dir> (Windows only)

After you have deployed the JAR file you will need to restart Tomcat to ensure 
it picks up the changes.

Check the alfresco.log file while the repository is starting up for any 
warnings or errors related to FFmpeg, if you have enabled it.

Using Video Previews
--------------------

Upload a media file to Alfresco Share. Both MPEG-4 (.mp4) and Flash Video 
(.flv) video files are supported natively by the player. MP3 format audio
files are supported natively by the audio preview component.

Other common formats may be uploaded and will also be supported by the 
preview, provided that FFmpeg is available on the server to perform 
conversions.

Once the file has been uploaded, navigate to the Document Details page to 
see the preview.

Where conversion is required the rendition generation will be triggered
the first time the file's Document Details page is viewed. A message will 
be displayed to indicate conversion is in progress.

In addition to converting media files to other formats, the previewer will
also attempt to use FFmpeg to generate thumbnail images for display in the
document library list view as well as within the Flash player as a splash
image.

Using the Video Preview dashlet
-------------------------------

Log in to Alfresco Share and navigate to a site dashboard. Click the 
Customize Dashboard button to edit the contents of the dashboard and drag 
the dashlet into one of the columns from the list of dashlets.

Known Issues
------------

In Internet Explorer 7, the Flash video previewer only displays correctly
the first time a video is loaded. After this the preview displays only a 
black box with the white 'play' button within it, and no video content.