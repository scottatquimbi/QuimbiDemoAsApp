import { NextRequest, NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ollama';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Ollama health check requested');
    
    // Check if Ollama is running and responsive
    const isHealthy = await checkOllamaHealth();
    
    if (isHealthy) {
      console.log('✅ Ollama health check passed');
      return NextResponse.json({
        status: 'healthy',
        message: 'Ollama is running and responsive',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Ollama health check failed');
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Ollama is not responding - may still be starting up',
        timestamp: new Date().toISOString()
      }, { status: 200 }); // Return 200 instead of 503 to avoid frontend errors
    }
  } catch (error) {
    console.error('🚨 Ollama health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for initialization requests
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Ollama initialization requested');
    
    // Perform health check to wake up Ollama
    const isHealthy = await checkOllamaHealth();
    
    if (isHealthy) {
      console.log('✅ Ollama initialization successful');
      return NextResponse.json({
        status: 'initialized',
        message: 'Ollama is ready for requests',
        model: 'llama3.1:8b',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Ollama initialization failed');
      return NextResponse.json({
        status: 'failed',
        message: 'Could not initialize Ollama - may still be starting up',
        timestamp: new Date().toISOString()
      }, { status: 200 }); // Return 200 instead of 503 to avoid frontend errors
    }
  } catch (error) {
    console.error('🚨 Ollama initialization error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}