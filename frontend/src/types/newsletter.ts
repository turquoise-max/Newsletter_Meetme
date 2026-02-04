export type BlockType = 
  | 'header' 
  | 'main_story' 
  | 'deep_dive' 
  | 'tool_spotlight' 
  | 'stat_box' 
  | 'bridge' 
  | 'insight' 
  | 'quote' 
  | 'divider' 
  | 'image' 
  | 'text' 
  | 'button' 
  | 'callout' 
  | 'quick_hits';

export interface Block {
  type: BlockType;
  content: any;
}

export interface Newsletter {
  title: string;
  blocks: Block[];
}