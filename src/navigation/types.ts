import type { EditorImage } from '../features/editor/types/editor.types';

export type RootStackParamList = {
  Home: undefined;
  Editor: { image: EditorImage };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
