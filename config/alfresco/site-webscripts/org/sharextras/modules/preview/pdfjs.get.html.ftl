<#-- This file is part of the Share Extras PdfJs Viewer project -->
<#assign el=args.htmlid?html>
    <div id="${el}-controls" class="controls flat-button">
      
      <div class="sidebarBtn">
          <button id="${el}-sidebarBtn">
            <img src="${url.context}/res/extras/components/preview/pdfjs/images/sidebar-show-16.png" align="top" height="16" title="${msg("button.sidebar")}" />
          </button>
      </div>

      <span class="searchBarToggle">
         <button id="${el}-searchBarToggle">${msg("button.search")}
         </button>
      </span>    
      <div class="separator"></div>
      <button id="${el}-previous">
        <img src="${url.context}/res/components/images/back-arrow.png" align="top" height="16"/>
        ${msg("button.previous")}
      </button>

      <button id="${el}-next">
        <img src="${url.context}/res/components/images/forward-arrow-16.png" align="top" height="16"/>
        ${msg("button.next")}
      </button>
    
      <input type="number" id="${el}-pageNumber" value="1" size="4" min="1" />

      <span>/</span>
      <span id="${el}-numPages" class="numPages">--</span>

      <div class="separator"></div>
      
      <button id="${el}-zoomOut" title="${msg("button.zoomout")}">
        <img src="${url.context}/res/extras/components/preview/pdfjs/images/zoom-out.svg" align="top" height="16"/>
      </button>
      <button id="${el}-zoomIn" title="${msg("button.zoomin")}">
        <img src="${url.context}/res/extras/components/preview/pdfjs/images/zoom-in.svg" align="top" height="16"/>
      </button>

      <button id="${el}-scaleSelectBtn"></button>
      <select id="${el}-scaleSelect">
        <option value="0.25">25%</option>
        <option value="0.5">50%</option>
        <option value="0.75">75%</option>
        <option value="1">100%</option>
        <option value="1.25">125%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
        <option value="4">400%</option>
        <option value="page-width">${msg("select.pagewidth")}</option>
        <option value="two-page-width">${msg("select.twopagewidth")}</option>
        <option value="page-fit">${msg("select.pagefit")}</option>
        <option value="two-page-fit">${msg("select.twopagefit")}</option>
        <option value="auto">${msg("select.auto")}</option>
      </select>

      <div class="separator"></div>
      
      <button id="${el}-fullpage">
        <img src="${url.context}/res/components/documentlibrary/actions/default-16.png" align="top" height="16"/>
        ${msg("button.maximize")}
      </button>

      <div class="separator"></div>

      <button id="${el}-download" title="${msg("button.download")}">
        <img src="${url.context}/res/components/documentlibrary/actions/document-download-16.png" align="top" height="16"/>
        ${msg("button.download")}
      </button>

      <span class="linkbutton">
         <button id="${el}-link" title="${msg("button.link")}">
           <img src="${url.context}/res/components/images/link-16.png" align="top" height="16"/>
         </button>
      </span>
      
    </div>
    
    <div id="${el}-searchControls" class="controls controlssearch flat-button hidden">
    <#-- Search bar -->
      <label for="${el}-findInput">${msg("button.search")}</label>:
      <input id="${el}-findInput" type="search" size="30">
      <button id="${el}-findPrevious">
        <img src="${url.context}/res/components/images/back-arrow.png" align="top" height="16"/>
        ${msg("button.previoushit")}
      </button>

      <button id="${el}-findNext">
        <img src="${url.context}/res/components/images/forward-arrow-16.png" align="top" height="16"/>
        ${msg("button.nexthit")}
      </button>
       <button id="${el}-findHighlightAll">
         ${msg("button.highlightall")}
       </button>
       <button id="${el}-findMatchCase">
         ${msg("button.matchcase")}
       </button>  
    </div>
    
    <div id="${el}-linkDialog" class="linkDialog">
        <div class="hd"></div>
        <div class="bd">
            <div id="${el}-linkDialog-bg" class="yui-buttongroup">
                <input type="radio" name="target" id="${el}-doc" value="${msg("link.document")}" />
                <input type="radio" name="target" id="${el}-page" value="${msg("link.page")}" checked="checked" />
            </div>
            <div>
                <input type="text" id="${el}-linkDialog-input" value="" />
            </div>
            <div>${msg("link.info")}</div>
        </div>
    </div>

    <div id="${el}-sidebar" class="sidebar">
        <div id="${el}-sidebarTabView" class="yui-navset">
            <ul class="yui-nav">
                <li class="selected"><a href="#${el}-thumbnailView"><em><img src="${url.context}/res/extras/components/preview/pdfjs/images/thumbnail-view-16.png" height="16" /></em></a></li>
                <li><a href="#${el}-outlineView"><em><img src="${url.context}/res/extras/components/preview/pdfjs/images/outline-view-16.png" height="16" /></em></a></li>
            </ul>
            <div class="yui-content">
                <div id="${el}-thumbnailView" class="thumbnailView documentView"></div>
                <div id="${el}-outlineView" class="outlineView"></div>
            </div>
        </div>
    </div>

    <div id="${el}-viewer" class="viewer documentView">
        <a name="${el}"></a>
    </div>