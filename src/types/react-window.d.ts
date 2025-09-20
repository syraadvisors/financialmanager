// Custom type declarations for react-window v2.1.1 compatibility
declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps<T = any> {
    index: number;
    style: React.CSSProperties;
    data?: T;
    isScrolling?: boolean;
  }

  export type ListChildComponent<T = any> = React.ComponentType<ListChildComponentProps<T>>;

  export interface FixedSizeListProps {
    children: ListChildComponent<any>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    innerTagName?: string;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    itemSize: number;
    layout?: 'vertical' | 'horizontal';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => any;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => any;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    outerTagName?: string;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export interface VariableSizeListProps {
    children: ListChildComponent<any>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    estimatedItemSize?: number;
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    innerTagName?: string;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    itemSize: (index: number) => number;
    layout?: 'vertical' | 'horizontal';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => any;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => any;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    outerTagName?: string;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export interface ListRef {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
  }

  export const FixedSizeList: React.ForwardRefExoticComponent<
    FixedSizeListProps & React.RefAttributes<ListRef>
  >;

  export const VariableSizeList: React.ForwardRefExoticComponent<
    VariableSizeListProps & React.RefAttributes<ListRef>
  >;

  // Alias for FixedSizeList (commonly used)
  export const List: React.ForwardRefExoticComponent<
    FixedSizeListProps & React.RefAttributes<ListRef>
  >;

  export default FixedSizeList;
}