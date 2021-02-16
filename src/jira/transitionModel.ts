export interface StatusCategory {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: string;
}

export interface To {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: StatusCategory;
}

export interface Fields {
}

export interface Transition {
  id: string;
  name: string;
  to: To;
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isAvailable: boolean;
  isConditional: boolean;
  fields: Fields;
  isLooped: boolean;
}

export default interface TransitionModel {
  expand: string;
  transitions: Transition[];
}
