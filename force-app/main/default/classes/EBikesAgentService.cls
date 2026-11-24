public with sharing class EBikesAgentService {

    @AuraEnabled(cacheable=false)
    public static String chat(String userMessage) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:EBikes_Python_Agent/api/chat');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(new Map<String,String>{
            'message' => userMessage
        }));
        req.setTimeout(30000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new AuraHandledException(
                'Agent error: ' + res.getStatusCode()
            );
        }
    }

    @AuraEnabled(cacheable=true)
    public static String getProducts() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:EBikes_Python_Agent/api/products');
        req.setMethod('GET');
        req.setTimeout(30000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new AuraHandledException(
                'Products error: ' + res.getStatusCode()
            );
        }
    }
}