'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * When true, booking/sidebar "cards" should render without their own card
 * chrome (rounded corners, shadow, border) because they're already sitting
 * inside a surface — e.g. the mobile bottom drawer. The same React element can
 * render chromed in the desktop sidebar and bare in the drawer, since the value
 * is read from wherever it's mounted in the tree.
 */
const BareCardContext = createContext(false);

export function BareCardProvider({ children }: { children: ReactNode }) {
  return (
    <BareCardContext.Provider value={true}>{children}</BareCardContext.Provider>
  );
}

export function useBareCard(): boolean {
  return useContext(BareCardContext);
}
