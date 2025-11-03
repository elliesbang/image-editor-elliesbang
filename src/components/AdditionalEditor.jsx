import React from "react";
import ResizeTool from "./AdditionalTools/ResizeTool";
import SvgConvertTool from "./AdditionalTools/SvgConvertTool";
import GifConvertTool from "./AdditionalTools/GifConvertTool";
import KeywordAnalyzeTool from "./AdditionalTools/KeywordAnalyzeTool";

export default function AdditionalEditor(props) {
  return (
    <div className="tools-wrap">
      <h3>✨ 추가 기능</h3>
      <ResizeTool {...props} />
      <SvgConvertTool {...props} />
      <GifConvertTool {...props} />
      <KeywordAnalyzeTool {...props} />
    </div>
  );
}
