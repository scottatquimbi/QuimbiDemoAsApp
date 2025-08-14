import { NextRequest, NextResponse } from 'next/server';
import { initializeModelPersistence, isModelPersistenceActive } from '@/lib/ollama-persistence';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'initialize') {
      console.log('🦙 API: Initializing model persistence...');
      try {
        await initializeModelPersistence();
        return NextResponse.json({
          success: true,
          message: 'Model persistence initialized',
          active: isModelPersistenceActive()
        });
      } catch (initError) {
        console.log('🦙 API: Model persistence initialization failed (non-critical):', initError);
        return NextResponse.json({
          success: false,
          message: 'Model persistence initialization failed (non-critical)',
          active: false
        });
      }
    }
    
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        active: isModelPersistenceActive()
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use "initialize" or "status"'
    }, { status: 400 });
    
  } catch (error) {
    console.log('🦙 API: Model persistence operation failed (non-critical):', error);
    
    return NextResponse.json({
      success: false,
      message: 'Model persistence operation failed (non-critical)',
      active: false
    });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      active: isModelPersistenceActive()
    });
  } catch (error) {
    console.log('🦙 API: Model persistence status check failed (non-critical):', error);
    
    return NextResponse.json({
      success: false,
      message: 'Status check failed (non-critical)',
      active: false
    });
  }
}