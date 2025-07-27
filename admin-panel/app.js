import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client
const supabaseUrl = 'https://qplnzqliygxjiydsmgui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwbG56cWxpeWd4aml5ZHNtZ3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTEyNDUsImV4cCI6MjA2OTAyNzI0NX0.VHvUf8lgYTGjI2bY2McTeiroJ_DJYlKDTGgk1gQxkcE';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM elements
const form = document.getElementById('newsletter-form');
const sendButton = document.getElementById('send-button');
const testButton = document.getElementById('test-button');
const resultDiv = document.getElementById('result');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('post-published-at').value = now.toISOString().slice(0, 16);
    
    // Load initial data
    loadSubscriberStats();
    loadRecentSubscribers();
    
    // Add event listeners
    form.addEventListener('submit', handleNewsletterSubmit);
    testButton.addEventListener('click', handleTestEmail);
});

// Load subscriber statistics
async function loadSubscriberStats() {
    try {
        const { data: totalSubscribers, error: totalError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact' });
            
        const { data: activeSubscribers, error: activeError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .is('unsubscribed_at', null);
            
        const { data: unsubscribed, error: unsubError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact' })
            .not('unsubscribed_at', 'is', null);

        if (!totalError && !activeError && !unsubError) {
            document.getElementById('total-subscribers').textContent = totalSubscribers.length || 0;
            document.getElementById('active-subscribers').textContent = activeSubscribers.length || 0;
            document.getElementById('unsubscribed').textContent = unsubscribed.length || 0;
        }
    } catch (error) {
        console.error('Error loading subscriber stats:', error);
    }
}

// Load recent subscribers
async function loadRecentSubscribers() {
    try {
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('*')
            .order('subscribed_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error loading subscribers:', error);
            return;
        }

        const tbody = document.getElementById('subscribers-list');
        tbody.innerHTML = '';

        subscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            const status = subscriber.is_active && !subscriber.unsubscribed_at ? 
                '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>' :
                '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Unsubscribed</span>';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subscriber.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${subscriber.name || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${status}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent subscribers:', error);
    }
}

// Handle newsletter form submission
async function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const postData = {
        title: formData.get('title'),
        slug: formData.get('slug'),
        excerpt: formData.get('excerpt'),
        publishedAt: new Date(formData.get('publishedAt')).toISOString()
    };
    
    setLoading(true);
    showResult('Sending newsletter...', 'info');
    
    try {
        const response = await fetch('https://qplnzqliygxjiydsmgui.supabase.co/functions/v1/send-newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                action: 'send-new-post',
                postData: postData
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showResult(`
                <div class="bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800">Newsletter sent successfully!</h3>
                            <div class="mt-2 text-sm text-green-700">
                                <p>Total subscribers: ${result.results.total}</p>
                                <p>Successful sends: ${result.results.success}</p>
                                <p>Failed sends: ${result.results.failed}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `, 'success');
        } else {
            showResult(`
                <div class="bg-red-50 border border-red-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Error sending newsletter</h3>
                            <div class="mt-2 text-sm text-red-700">
                                <p>${result.error || 'Unknown error occurred'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `, 'error');
        }
    } catch (error) {
        showResult(`
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error sending newsletter</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>${error.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `, 'error');
    } finally {
        setLoading(false);
    }
}

// Handle test email
async function handleTestEmail() {
    const formData = new FormData(form);
    const postData = {
        title: formData.get('title') || 'Test Post',
        slug: formData.get('slug') || 'test-post',
        excerpt: formData.get('excerpt') || 'This is a test email.',
        publishedAt: new Date(formData.get('publishedAt') || Date.now()).toISOString()
    };
    
    setLoading(true);
    showResult('Sending test email...', 'info');
    
    try {
        const response = await fetch('https://qplnzqliygxjiydsmgui.supabase.co/functions/v1/send-newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                action: 'send-test',
                postData: postData
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showResult(`
                <div class="bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800">Test email sent successfully!</h3>
                            <div class="mt-2 text-sm text-green-700">
                                <p>Check your email to see the test newsletter.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `, 'success');
        } else {
            showResult(`
                <div class="bg-red-50 border border-red-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Error sending test email</h3>
                            <div class="mt-2 text-sm text-red-700">
                                <p>${result.error || 'Unknown error occurred'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `, 'error');
        }
    } catch (error) {
        showResult(`
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error sending test email</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>${error.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `, 'error');
    } finally {
        setLoading(false);
    }
}

// Set loading state
function setLoading(loading) {
    if (loading) {
        sendButton.disabled = true;
        testButton.disabled = true;
        sendButton.textContent = 'Sending...';
        testButton.textContent = 'Sending...';
        document.body.classList.add('loading');
    } else {
        sendButton.disabled = false;
        testButton.disabled = false;
        sendButton.textContent = 'Send Newsletter';
        testButton.textContent = 'Send Test Email';
        document.body.classList.remove('loading');
    }
}

// Show result message
function showResult(message, type = 'info') {
    resultDiv.innerHTML = message;
} 