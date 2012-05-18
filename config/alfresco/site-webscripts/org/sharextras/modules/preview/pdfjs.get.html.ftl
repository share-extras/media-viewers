<#-- This file is part of the Share Extras PdfJs Viewer project -->
<#assign el=args.htmlid?html>
    <div id="${el}-controls" class="controls">
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
      <span id="${el}-numPages">--</span>

      <button id="${el}-zoomOut" title="${msg("button.zoomout")}">
        <img src="${url.context}/res/extras/components/preview/pdfjs/images/zoom-out.svg" align="top" height="16"/>
      </button>
      <button id="${el}-zoomIn" title="${msg("button.zoomin")}">
        <img src="${url.context}/res/extras/components/preview/pdfjs/images/zoom-in.svg" align="top" height="16"/>
      </button>

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

      <button id="${el}-download" title="${msg("button.download")}">
        <img src="${url.context}/res/components/documentlibrary/actions/document-download-16.png" align="top" height="16"/>
        ${msg("button.download")}
      </button>

      <button id="${el}-fullpage">
        <img src="${url.context}/res/components/documentlibrary/actions/default-16.png" align="top" height="16"/>
        ${msg("button.maximize")}
      </button>

    </div>

    <div id="${el}-viewer" class="viewer">
        <a name="${el}"></a>
    </div>