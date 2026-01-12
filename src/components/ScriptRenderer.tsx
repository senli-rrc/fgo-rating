import React from 'react';
import {
  ScriptInfo,
  ScriptComponentType,
  ScriptDialogue,
  ScriptComponentWrapper,
  Region,
  ScriptChoices,
  DialogueChildComponent,
  DialogueText,
  ScriptBackground,
  ScriptCharaFace,
  ScriptBracketComponent,
  ScriptChoiceChildComponent,
  ComponentWrapper,
  ScriptCharaFaceFade,
  ScriptCharaMove,
  ScriptCharaFadeIn,
  ScriptPictureFrame,
  ScriptCharaFilter,
  CameraFilterType,
} from '../utils/scriptParser';

// --- Simplified Sub-components ---

const ScriptDialogueLine: React.FC<{
  region?: Region;
  components: DialogueChildComponent[];
}> = ({ components }) => {
  return (
    <span className="text-lg leading-relaxed text-gray-800">
      {components.map((component, i) => {
        switch (component.type) {
          case ScriptComponentType.DIALOGUE_TEXT:
            return <span key={i}>{component.text}</span>;
          case ScriptComponentType.DIALOGUE_NEW_LINE:
            return <br key={i} />;
          case ScriptComponentType.DIALOGUE_RUBY:
            return (
              <ruby key={i} className="mx-1">
                {component.text}
                <rt className="text-xs text-gray-500">{component.ruby}</rt>
              </ruby>
            );
          case ScriptComponentType.DIALOGUE_PLAYER_NAME:
            return <span key={i} className="text-blue-600 font-semibold">Master</span>;
          case ScriptComponentType.DIALOGUE_GENDER:
            // Default to male for now, or could make interactive
            return (
              <span key={i}>
                <ScriptDialogueLine components={component.male} />
              </span>
            );
          case ScriptComponentType.DIALOGUE_TEXT_IMAGE:
            return (
              <img
                key={i}
                src={component.imageAsset}
                alt="symbol"
                className="inline-block h-6 w-auto align-middle"
              />
            )
          default:
            return null;
        }
      })}
    </span>
  );
};

const Scene: React.FC<{
  background?: { asset: string };
  figure?: { asset: string; face: number; silhouette?: boolean };
  equip?: { asset: string };
  foreground?: { frame: string };
}> = ({ background, figure, equip, foreground }) => {
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg shadow-md my-2 border border-gray-700">
      {/* Background */}
      {background?.asset && (
        <img
          src={background.asset}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Character Figure */}
      {figure?.asset && (
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-auto h-[90%] transition-opacity duration-300 ${figure.silhouette ? 'brightness-0' : ''}`}>
          <img
            src={figure.asset}
            alt="Character"
            className="w-auto h-full object-contain drop-shadow-lg"
            loading="lazy"
          />
        </div>
      )}

      {/* Equip/CE */}
      {equip?.asset && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3">
          <img src={equip.asset} alt="Equip" className="w-full h-auto shadow-2xl rounded" />
        </div>
      )}

      {/* Foreground Frame */}
      {foreground?.frame && (
        <img
          src={foreground.frame}
          alt="Frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}
    </div>
  );
};

// --- Row Components ---

const DialogueRow: React.FC<{
  dialogue: ScriptDialogue;
  lineNumber?: number;
}> = ({ dialogue, lineNumber }) => {

  // Extract speaker name
  const speakerName = dialogue.speaker?.name ? (
    <span className="font-bold text-blue-400 block mb-1">
      <ScriptDialogueLine components={dialogue.speaker.components} />
    </span>
  ) : null;

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors border-b border-gray-700">
      <div className="w-12 text-xs text-gray-500 pt-1 shrink-0 font-mono text-right select-none opacity-50">
        {lineNumber}
      </div>

      {/* Avatar or Speaker Label placeholder */}
      <div className="w-24 shrink-0 text-right">
        {speakerName}
      </div>

      <div className="flex-1">
        <div className="bg-gray-900/80 p-4 rounded-lg text-gray-100 shadow-sm border border-gray-600 relative">
          {/* Voice Line Indicator (simplified) */}
          {(dialogue.voice || dialogue.maleVoice) && (
            <div className="absolute -top-3 -right-2 bg-green-900 text-green-200 text-xs px-2 py-1 rounded-full border border-green-700">
              Voice
              {/* In a real app, play button here */}
            </div>
          )}

          <ScriptDialogueLine components={dialogue.components.flat()} />
        </div>
      </div>
    </div>
  );
};

const ChoiceRow: React.FC<{
  component: ScriptChoices;
  lineNumber?: number;
}> = ({ component, lineNumber }) => {
  return (
    <div className="py-6 px-4 bg-gray-900/30 border-y border-gray-700">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center text-sm text-gray-400 mb-2 uppercase tracking-widest font-semibold">Decision</div>
        {component.choices.map((choice) => (
          <div key={choice.id} className="group">
            <button className="w-full p-4 bg-gradient-to-r from-purple-900/80 to-blue-900/80 hover:from-purple-800 hover:to-blue-800 border border-purple-500/50 text-white rounded-lg shadow-lg transition-all transform hover:scale-[1.02] text-left">
              <span className="font-bold mr-2 text-yellow-400">➤</span>
              <ScriptDialogueLine components={choice.option} />
            </button>

            {/* Recursive rendering for results */}
            {choice.results.length > 0 && (
              <div className="mt-4 ml-8 pl-4 border-l-2 border-purple-500/30">
                {choice.results.map((res, i) => (
                  <ScriptRow key={i} wrapper={res} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SceneRow: React.FC<{
  background?: ScriptBackground;
  figure?: ScriptCharaFace | ScriptCharaFaceFade;
  charaFadeIn?: ScriptCharaFadeIn | ScriptCharaMove;
  foreground?: { frame?: ScriptPictureFrame };
  colSpan?: number;
  halfWidth?: boolean;
  lineNumber?: number;
}> = ({ background, figure, charaFadeIn, foreground, lineNumber }) => {

  let figureData = undefined;
  if (figure?.assetSet?.type === ScriptComponentType.CHARA_SET ||
    figure?.assetSet?.type === ScriptComponentType.CHARA_CHANGE) {
    figureData = {
      asset: figure.assetSet.charaGraphAsset,
      face: figure.face,
      silhouette: false // Logic for silhouette requires tracking state, simplified here
    };
  }
  // Handle CharaFadeIn which might be an image set
  else if (charaFadeIn?.assetSet?.type === ScriptComponentType.IMAGE_SET ||
    charaFadeIn?.assetSet?.type === ScriptComponentType.VERTICAL_IMAGE_SET) {
    figureData = {
      asset: charaFadeIn.assetSet.imageAsset,
      face: 0
    };
  }

  const backgroundData = background ? { asset: background.backgroundAsset } :
    (charaFadeIn?.assetSet?.type === ScriptComponentType.SCENE_SET ?
      { asset: charaFadeIn.assetSet.backgroundAsset } : undefined);

  const foregroundData = foreground?.frame?.imageAsset ? { frame: foreground.frame.imageAsset } : undefined;

  // Don't render empty scenes unless it's explicitly clearing (not handled here)
  if (!backgroundData && !figureData && !foregroundData) return null;

  return (
    <div className="p-4 bg-black/20 text-center">
      <div className="w-12 text-xs text-gray-500 shrink-0 font-mono inline-block text-right pr-4 align-top">
        {lineNumber}
      </div>
      <div className="inline-block w-full max-w-4xl">
        <Scene
          background={backgroundData}
          figure={figureData}
          foreground={foregroundData}
        />
      </div>
    </div>
  );
};

// --- Main Renderer ---

const ScriptRow: React.FC<{
  wrapper: ScriptComponentWrapper;
  // We would need to pass state/refs down for full functionality
  state?: any;
}> = ({ wrapper }) => {
  const { content, lineNumber } = wrapper;

  switch (content.type) {
    case ScriptComponentType.DIALOGUE:
      return <DialogueRow dialogue={content} lineNumber={lineNumber} />;
    case ScriptComponentType.CHOICES:
      return <ChoiceRow component={content} lineNumber={lineNumber} />;
    case ScriptComponentType.BACKGROUND:
      // Handled by state tracking in a real implementation,
      // but for a simple list render, we just show the change
      return <SceneRow background={content} lineNumber={lineNumber} />;
    default:
      // For brackets, we primarily care about visual changes
      if (content.type === ScriptComponentType.CHARA_SET ||
        content.type === ScriptComponentType.CHARA_CHANGE ||
        content.type === ScriptComponentType.CHARA_FACE) {
        // Creating a dummy wrapper to use SceneRow for chara updates
        // In a real app, this updates the "current scene state"
        // Here, we'll try to visually represent it if it's a major change
        return null; // Implicit state changes are hard to render in a linear list without context
      }

      // Handle explicit scene affecting components
      if (content.type === ScriptComponentType.CHARA_FADE_IN) {
        return <SceneRow charaFadeIn={content} lineNumber={lineNumber} />;
      }

      // Debug/Info for other components
      return (
        <div className="px-4 py-1 text-xs text-gray-400 font-mono border-l-2 border-gray-800 ml-16 pl-2 hover:text-gray-300">
          [{lineNumber}] {content.type}
        </div>
      );
  }
};

const ScriptRenderer: React.FC<{
  script: ScriptInfo;
  region?: Region;
}> = ({ script, region = Region.JP }) => {

  // In a full implementation, we need to reduce the script components to determine
  // the state (current BG, current Figure) at each line to render SceneRows correctly.
  // For this MVP, we will try to render them linearly.

  // We'll do a quick pass to pair dialogues with their active scenes
  // or just render them as they come.

  // Optimization: Merge scene updates.

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans">
      <div className="container mx-auto max-w-5xl bg-gray-950 shadow-2xl min-h-screen border-x border-gray-800">
        {script.components.map((wrapper, i) => (
          <ScriptRow key={i} wrapper={wrapper} />
        ))}
      </div>
    </div>
  );
};

export default ScriptRenderer;
