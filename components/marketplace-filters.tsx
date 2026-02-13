'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { brands, materials, conditions, weights } from '@/lib/data'

// Staticke kategorie - pocty se aktualizuji dynamicky
const defaultCategories = [
  { id: 'steel-darts', name: 'Ocelové šipky' },
  { id: 'soft-darts', name: 'Softové šipky' },
  { id: 'dartboards', name: 'Terče' },
  { id: 'accessories', name: 'Příslušenství' },
]

interface FiltersState {
  priceRange: [number, number]
  weights: string[]
  materials: string[]
  brands: string[]
  conditions: string[]
  categories: string[]
}

interface MarketplaceFiltersProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  isSidebar?: boolean
}

// Kategorie, které jsou šipky a mají filtry hmotnost/materiál
const dartCategories = ['steel-darts', 'soft-darts']

function FilterContent({ filters, onFiltersChange }: MarketplaceFiltersProps) {
  // Zobrazit filtry hmotnost/materiál pouze pokud je vybraná kategorie šipek
  const showDartFilters = filters.categories.some(cat => dartCategories.includes(cat))

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] })
  }

  const handleCheckboxChange = (
    key: keyof Pick<FiltersState, 'weights' | 'materials' | 'brands' | 'conditions' | 'categories'>,
    value: string,
    checked: boolean
  ) => {
    const current = filters[key]
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value)
    onFiltersChange({ ...filters, [key]: updated })
  }

  const clearFilters = () => {
    onFiltersChange({
      priceRange: [0, 50000],
      weights: [],
      materials: [],
      brands: [],
      conditions: [],
      categories: [],
    })
  }

  const hasActiveFilters =
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000 ||
    filters.weights.length > 0 ||
    filters.materials.length > 0 ||
    filters.brands.length > 0 ||
    filters.conditions.length > 0 ||
    filters.categories.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtry</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
            Vymazat vše
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={['price', 'category', 'weight', 'brand']} className="w-full">
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm hover:no-underline">Cenové rozmezí</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceChange}
                max={50000}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filters.priceRange[0].toLocaleString('cs-CZ')} Kč</span>
                <span>{filters.priceRange[1].toLocaleString('cs-CZ')} Kč+</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="category">
          <AccordionTrigger className="text-sm hover:no-underline">Kategorie</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {defaultCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('categories', category.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer flex-1">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {showDartFilters && (
          <AccordionItem value="weight">
            <AccordionTrigger className="text-sm hover:no-underline">Hmotnost</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {weights.map((weight) => (
                  <Button
                    key={weight}
                    variant={filters.weights.includes(weight) ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      handleCheckboxChange('weights', weight, !filters.weights.includes(weight))
                    }
                  >
                    {weight}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {showDartFilters && (
          <AccordionItem value="material">
            <AccordionTrigger className="text-sm hover:no-underline">Materiál</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {materials.map((material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={filters.materials.includes(material)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('materials', material, checked as boolean)
                      }
                    />
                    <Label htmlFor={`material-${material}`} className="text-sm font-normal cursor-pointer">
                      {material}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="brand">
          <AccordionTrigger className="text-sm hover:no-underline">Značka</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('brands', brand, checked as boolean)
                    }
                  />
                  <Label htmlFor={`brand-${brand}`} className="text-sm font-normal cursor-pointer">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="condition">
          <AccordionTrigger className="text-sm hover:no-underline">Stav</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {conditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition}`}
                    checked={filters.conditions.includes(condition)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('conditions', condition, checked as boolean)
                    }
                  />
                  <Label htmlFor={`condition-${condition}`} className="text-sm font-normal cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export function MarketplaceFilters({ filters, onFiltersChange, isSidebar = false }: MarketplaceFiltersProps) {
  const [open, setOpen] = useState(false)

  const activeFilterCount =
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0) +
    filters.weights.length +
    filters.materials.length +
    filters.brands.length +
    filters.conditions.length +
    filters.categories.length

  // Sidebar mode - just render the filter content
  if (isSidebar) {
    return <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
  }

  // Mobile/Tablet mode - render the sheet trigger button
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 shrink-0">
          <SheetTitle>Filtry</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
        </div>
        <div className="shrink-0 p-4 pt-4 pb-20 md:pb-4 border-t border-border bg-background">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Použít filtry
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export type { FiltersState }
