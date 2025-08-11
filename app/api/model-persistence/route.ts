import { NextRequest, NextResponse } from 'next/server';
import { initializeModelPersistence, isModelPersistenceActive } from '@/lib/ollama-persistence';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'initialize') {
      console.log('🦙 API: Initializing model persistence...');
      await initializeModelPersistence();
      
      return NextResponse.json({
        success: true,
        message: 'Model persistence initialized',
        active: isModelPersistenceActive()
      });
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
    console.error('🦙 API: Model persistence error:', error);
    
    return NextResponse.json({
      error: 'Model persistence operation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      active: isModelPersistenceActive()
    });
  } catch (error) {
    console.error('🦙 API: Model persistence status check failed:', error);
    
    return NextResponse.json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}