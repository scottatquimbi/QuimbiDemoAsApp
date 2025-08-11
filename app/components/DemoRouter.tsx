'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { isDemoMode, isDemoRoute, getEnvironmentConfig } from '@/lib/demo-config';

/**
 * Demo Router Component
 * Handles environment-based routing between demo and production modes
 */

interface DemoRouterProps {
  demoComponent: React.ComponentType<any>;
  productionComponent: React.ComponentType<any>;
  componentProps?: any;
}

export default function DemoRouter({ 
  demoComponent: DemoComponent, 
  productionComponent: ProductionComponent,
  componentProps = {}
}: DemoRouterProps) {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  useEffect(() => {
    // Determine if we should show demo or production component
    const checkDemoMode = () => {
      const envConfig = getEnvironmentConfig();
      const urlHasDemoParam = searchParams.get('demo') === 'true';
      const isOnDemoRoute = isDemoRoute(pathname);
      const demoModeActive = isDemoMode();
      
      // Show demo component if:
      // 1. Environment allows demo AND
      // 2. (URL has demo param OR we're on a demo route OR demo mode is active)
      const shouldShowDemo = envConfig.demoEnabled && 
        (urlHasDemoParam || isOnDemoRoute || demoModeActive);
      
      setIsDemo(shouldShowDemo);
      setIsLoading(false);
      
      console.log('Demo Router Decision:', {
        shouldShowDemo,
        envConfig,
        urlHasDemoParam,
        isOnDemoRoute,
        demoModeActive,
        pathname
      });
    };
    
    checkDemoMode();
  }, [searchParams, pathname]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return isDemo ? 
    <DemoComponent {...componentProps} /> : 
    <ProductionComponent {...componentProps} />;
}

/**
 * Higher-order component for demo/production routing
 */
export function withDemoRouter<T extends Record<string, any>>(
  DemoComponent: React.ComponentType<T>,
  ProductionComponent: React.ComponentType<T>
) {
  return function RoutedComponent(props: T) {
    return (
      <DemoRouter
        demoComponent={DemoComponent}
        productionComponent={ProductionComponent}
        componentProps={props}
      />
    );
  };
}