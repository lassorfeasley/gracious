import { Check } from 'lucide-react';
import { PropertyMap } from '@/components/dashboard/property-map';
import type { Property } from '@/types/database';

/**
 * Read-only property detail sections (About / Location / Amenities / Guest info)
 * shared by the guest invite page and the host manage-booking view. Each section
 * is hidden when its data is empty.
 */
export function PropertySections({ property }: { property: Property }) {
  return (
    <>
      {property.description && (
        <section className="py-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            About this place
          </h2>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
            {property.description}
          </p>
        </section>
      )}

      {property.address && (
        <section className="py-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Where you&apos;re staying
          </h2>
          <div className="mt-6">
            <PropertyMap
              address={property.address}
              latitude={property.latitude}
              longitude={property.longitude}
            />
          </div>
          {property.directions && (
            <div className="mt-8">
              <h3 className="text-lg font-medium">Getting there</h3>
              <p className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                {property.directions}
              </p>
            </div>
          )}
        </section>
      )}

      {property.amenities && property.amenities.length > 0 && (
        <section className="py-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            What this place offers
          </h2>
          <ul className="mt-8 grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {property.amenities.map((a) => (
              <li
                key={a.key}
                className="flex items-start gap-4 border-b border-border/60 pb-5 text-base"
              >
                <Check
                  className="mt-0.5 h-5 w-5 shrink-0 text-foreground"
                  strokeWidth={1.5}
                />
                <span>
                  {a.label}
                  {a.note ? (
                    <span className="block text-sm text-muted-foreground">
                      {a.note}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(property.wifi_name ||
        property.check_in_instructions ||
        property.house_rules) && (
        <section className="py-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Guest information
          </h2>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2">
            {property.check_in_instructions && (
              <div>
                <dt className="text-base font-medium">Check-in instructions</dt>
                <dd className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                  {property.check_in_instructions}
                </dd>
              </div>
            )}
            {property.wifi_name && (
              <div>
                <dt className="text-base font-medium">WiFi</dt>
                <dd className="mt-2 text-base text-muted-foreground">
                  {property.wifi_name}
                  {property.wifi_password
                    ? ` · ${property.wifi_password}`
                    : ''}
                </dd>
              </div>
            )}
            {property.house_rules && (
              <div>
                <dt className="text-base font-medium">House rules</dt>
                <dd className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                  {property.house_rules}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </>
  );
}
