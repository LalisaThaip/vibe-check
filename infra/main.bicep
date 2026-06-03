// Azure infrastructure for Vibe Check - Video Engagement Scoring Platform
// Deploy with: az deployment group create --resource-group <rg> --template-file main.bicep

@description('Base name for all resources')
param appName string = 'vibe-check'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('SKU for the App Service Plan')
param functionPlanSku string = 'Y1'

// --- Storage Account (Blob Storage for videos) ---
var storageAccountName = replace('${appName}store', '-', '')

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource videoContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'vibe-check-videos'
  properties: {
    publicAccess: 'None'
  }
}

// --- Azure AI Face API (Cognitive Services) ---
resource faceAccount 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: '${appName}-face'
  location: location
  kind: 'Face'
  sku: {
    name: 'F0' // Free tier
  }
  properties: {
    customSubDomainName: '${appName}-face'
    publicNetworkAccess: 'Enabled'
  }
}

// --- App Service Plan (Consumption for Function App) ---
resource functionPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'functionapp'
  sku: {
    name: functionPlanSku
    tier: 'Dynamic'
  }
}

// --- Application Insights (monitoring) ---
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

// --- Function App ---
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-func'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: functionPlan.id
    httpsOnly: true
    siteConfig: {
      pythonVersion: '3.10'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'AZURE_STORAGE_CONTAINER'
          value: 'vibe-check-videos'
        }
        {
          name: 'AZURE_FACE_ENDPOINT'
          value: faceAccount.properties.endpoint
        }
        {
          name: 'AZURE_FACE_KEY'
          value: faceAccount.listKeys().key1
        }
      ]
    }
  }
}

// --- Outputs ---
output storageAccountName string = storageAccount.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output faceEndpoint string = faceAccount.properties.endpoint
output appInsightsKey string = appInsights.properties.InstrumentationKey
