package ru.tone.crmcontracts;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable QUIC to avoid net::ERR_QUIC_PROTOCOL_ERROR on some providers
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            android.webkit.WebSettings settings = webView.getSettings();
            // Force using HTTP/1.1 instead of QUIC/HTTP3
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                settings.setSafeBrowsingEnabled(false);
            }
        }
    }
}
