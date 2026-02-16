'use client'
import { Trade } from '@/prisma/generated/prisma/browser'
import { ImportType } from '../import-type-selection'
import type { ComponentType } from 'react'
import ImportTypeSelection from '../import-type-selection'
import FileUpload from '../file-upload'
import HeaderSelection from '../header-selection'
import AccountSelection from '../account-selection'
import ColumnMapping from '../column-mapping'
import { FormatPreview } from '../components/format-preview'
import ManualProcessor from '../manual/manual-processor'
import { Step } from '../import-button'
import { Sparkles, PenTool } from 'lucide-react'

type TranslationKey =
  | 'import.steps.selectPlatform'
  | 'import.steps.selectPlatformDescription'
  | 'import.steps.uploadFile'
  | 'import.steps.uploadFileDescription'
  | 'import.steps.selectHeaders'
  | 'import.steps.selectHeadersDescription'
  | 'import.steps.mapColumns'
  | 'import.steps.mapColumnsDescription'
  | 'import.steps.selectAccount'
  | 'import.steps.selectAccountDescription'
  | 'import.steps.reviewTrades'
  | 'import.steps.reviewTradesDescription'
  | 'import.steps.processTrades'
  | 'import.steps.processTradesDescription'
  | 'import.steps.connectAccount'
  | 'import.steps.connectAccountDescription'
  | 'import.steps.processFile'
  | 'import.steps.processFileDescription'
  | 'import.steps.manualEntry'
  | 'import.steps.manualEntryDescription'

export interface ProcessedData {
  headers: string[]
  processedData: string[][]
}

type StepComponent =
  | typeof ImportTypeSelection
  | typeof FileUpload
  | typeof HeaderSelection
  | typeof AccountSelection
  | typeof ColumnMapping
  | typeof FormatPreview
  | typeof ManualProcessor


export interface PlatformProcessorProps {
  csvData: string[][]
  headers: string[]
  processedTrades: Partial<Trade>[]
  setProcessedTrades: React.Dispatch<React.SetStateAction<Partial<Trade>[]>>
  accountNumbers?: string[]
  selectedAccountNumbers?: string[]
  setSelectedAccountNumbers?: React.Dispatch<React.SetStateAction<string[]>>
}

export interface PlatformConfig {
  platformName: string
  type: string
  name: string
  description: string
  category: 'Direct Account Sync' | 'Intelligent Import' | 'Platform CSV Import' | 'Manual Entry'
  videoUrl?: string
  details: string
  logo: {
    path?: string
    alt?: string
    component?: ComponentType<{}>
  }
  isDisabled?: boolean
  isComingSoon?: boolean
  skipHeaderSelection?: boolean
  requiresAccountSelection?: boolean
  processFile?: (data: string[][]) => ProcessedData
  customComponent?: ComponentType<{ setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }>
  processorComponent?: ComponentType<PlatformProcessorProps>
  tutorialLink?: string
  steps: {
    id: Step
    title: TranslationKey
    description: TranslationKey
    component: StepComponent
    isLastStep?: boolean
  }[]
}

const processStandardCsv = (data: string[][]): ProcessedData => {
  if (data.length === 0) {
    throw new Error("The CSV file appears to be empty or invalid.")
  }
  const headers = data[0].filter(header => header && header.trim() !== '')
  return { headers, processedData: data.slice(1) };
};

export const platforms: PlatformConfig[] = [
  {
    platformName: 'csv-ai',
    type: '',
    name: 'import.type.csvAi.name',
    description: 'import.type.csvAi.description',
    category: 'Intelligent Import',
    videoUrl: '',
    details: '',
    logo: {
      component: () => <Sparkles className="w-4 h-4" />,
    },
    requiresAccountSelection: true,
    processFile: processStandardCsv,
    steps: [
      {
        id: 'select-import-type',
        title: 'import.steps.selectPlatform',
        description: 'import.steps.selectPlatformDescription',
        component: ImportTypeSelection
      },
      {
        id: 'upload-file',
        title: 'import.steps.uploadFile',
        description: 'import.steps.uploadFileDescription',
        component: FileUpload
      },
      {
        id: 'map-columns',
        title: 'import.steps.mapColumns',
        description: 'import.steps.mapColumnsDescription',
        component: ColumnMapping
      },
      {
        id: 'select-account',
        title: 'import.steps.selectAccount',
        description: 'import.steps.selectAccountDescription',
        component: AccountSelection
      },
      {
        id: 'preview-trades',
        title: 'import.steps.reviewTrades',
        description: 'import.steps.reviewTradesDescription',
        component: FormatPreview,
        isLastStep: true
      }
    ]
  },
  {
    platformName: 'manual-entry',
    type: 'manual-entry',
    name: 'import.type.manualEntry.name',
    description: 'import.type.manualEntry.description',
    category: 'Manual Entry',
    videoUrl: '',
    details: 'import.type.manualEntry.details',
    logo: {
      component: () => <PenTool className="w-4 h-4" />,
    },
    requiresAccountSelection: true,
    processorComponent: ManualProcessor,
    steps: [
      {
        id: 'select-import-type',
        title: 'import.steps.selectPlatform',
        description: 'import.steps.selectPlatformDescription',
        component: ImportTypeSelection
      },
      {
        id: 'select-account',
        title: 'import.steps.selectAccount',
        description: 'import.steps.selectAccountDescription',
        component: AccountSelection
      },
      {
        id: 'preview-trades',
        title: 'import.steps.manualEntry',
        description: 'import.steps.manualEntryDescription',
        component: ManualProcessor,
        isLastStep: true
      }
    ]
  }
] as const

export type PlatformType = typeof platforms[number]['platformName']
