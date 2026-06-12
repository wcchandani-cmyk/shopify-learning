import { useDiscountForm } from "../../hooks/discount/useDiscountForm";
import "../../styles/DiscountDetail.css";

import DiscountHeaderSection from "./DiscountHeaderSection";
import FreeShippingSection from "./FreeShippingSection";
import BuyXGetYSection from "./BuyXGetYSection";
import DiscountValueSection from "./DiscountValueSection";
import EligibilitySection from "./EligibilitySection";
import MinimumRequirementsSection from "./MinimumRequirementsSection";

import MaximumUsesSection from "./MaximumUsesSection";
import CombinationsSection from "./CombinationsSection";
import ActiveDatesSection from "./ActiveDatesSection";
import Timeline from "../shared/Timeline";
import {
  listDiscountComments,
  addDiscountComment,
  deleteDiscountComment,
} from "../../services/discountService";

import DiscountSummaryCard from "./DiscountSummaryCard";
import SalesChannelAccessSection from "./SalesChannelAccessSection";
import TagsSection from "../shared/TagsSection";

import SalesChannelsModal from "./SalesChannelsModal";
import SelectCountriesModal from "../shared/SelectCountriesModal";
import EditVariantsModal from "./EditVariantsModal";
import BrowseSelectModal from "./BrowseSelectModal";

export default function DiscountDetail({ type, isNew = true, discountData = null }) {
  const d = useDiscountForm({ type, isNew, discountData });

  return (
    <s-page heading={d.pageHeading}>
      <s-link
        slot="breadcrumb-actions"
        href="/discounts"
        onClick={(event) => {
          event.preventDefault();
          d.handleCancel();
        }}
      >
        Discounts
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={d.handleSave}
        loading={d.saving || undefined}
      >
        Save
      </s-button>
      {!isNew && (
        <div slot="secondary-action" className="discount-header-actions" ref={d.headerMenuRef}>
          <s-button onClick={d.handleDuplicateDiscount}>
            Duplicate
          </s-button>
          <div style={{ position: "relative", display: "inline-flex" }}>
            <s-button
              data-header-actions-trigger
              onClick={() => d.setHeaderMenuOpen((open) => !open)}
            >
              More actions
            </s-button>
            {d.headerMenuOpen && (
              <div className="company-actions__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="company-actions__item"
                  style={{ color: "#d82c0d" }}
                  onClick={d.handleDeleteDiscount}
                >
                  Delete discount
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {d.saveError && (
        <s-banner tone="critical" heading="Could not save discount">
          {d.saveError}
        </s-banner>
      )}

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">

              <DiscountHeaderSection
                form={d.form}
                updateField={d.updateField}
                isNew={isNew}
                displayType={d.displayType}
                onGenerateCode={d.handleGenerateCode}
              />

              {type === "Free shipping" ? (
                <FreeShippingSection
                  form={d.form}
                  updateField={d.updateField}
                  countrySearchQuery={d.countrySearchQuery}
                  setCountrySearchQuery={d.setCountrySearchQuery}
                  autocompleteCountries={d.autocompleteCountries}
                  onOpenCountryModal={d.openCountryModal}
                />
              ) : type === "Buy X get Y" ? (
                <BuyXGetYSection
                  form={d.form}
                  setForm={d.setForm}
                  updateField={d.updateField}
                  buysSearchQuery={d.buysSearchQuery}
                  setBuysSearchQuery={d.setBuysSearchQuery}
                  getsSearchQuery={d.getsSearchQuery}
                  setGetsSearchQuery={d.setGetsSearchQuery}
                  filteredBuysItems={d.filteredBuysItems}
                  filteredGetsItems={d.filteredGetsItems}
                  isExpandedBuys={d.isExpandedBuys}
                  setIsExpandedBuys={d.setIsExpandedBuys}
                  isExpandedGets={d.isExpandedGets}
                  setIsExpandedGets={d.setIsExpandedGets}
                  onBrowse={d.handleBrowse}
                  onEditProduct={d.setEditingProduct}
                />
              ) : (
                <DiscountValueSection
                  form={d.form}
                  setForm={d.setForm}
                  updateField={d.updateField}
                  appliesToSearchQuery={d.appliesToSearchQuery}
                  setAppliesToSearchQuery={d.setAppliesToSearchQuery}
                  filteredSelectedItems={d.filteredSelectedItems}
                  isExpandedResources={d.isExpandedResources}
                  setIsExpandedResources={d.setIsExpandedResources}
                  onBrowse={d.handleBrowse}
                  onEditProduct={d.setEditingProduct}
                />
              )}

              <EligibilitySection
                form={d.form}
                updateField={d.updateField}
                type={type}
                openMarketsModal={d.openMarketsModal}
                openSegmentsModal={d.openSegmentsModal}
                openCustomersModal={d.openCustomersModal}
              />

              {type !== "Buy X get Y" && (
                <MinimumRequirementsSection form={d.form} updateField={d.updateField} />
              )}



              <MaximumUsesSection form={d.form} updateField={d.updateField} />

              <CombinationsSection form={d.form} updateField={d.updateField} displayType={d.displayType} />

              <ActiveDatesSection form={d.form} updateField={d.updateField} />

              {!isNew && discountData?.id && (
                <Timeline
                  entityId={discountData.id}
                  listComments={listDiscountComments}
                  addComment={addDiscountComment}
                  deleteComment={deleteDiscountComment}
                />
              )}

            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">

              <DiscountSummaryCard
                shopify={d.shopify}
                type={type}
                displayType={d.displayType}
                isNew={isNew}
                form={d.form}
                summaryHeader={d.summaryHeader}
                summaryDetails={d.summaryDetails}
                sidebarBadgeTone={d.sidebarBadgeTone}
                sidebarBadgeLabel={d.sidebarBadgeLabel}
              />

              <SalesChannelAccessSection
                form={d.form}
                updateField={d.updateField}
                onOpenChannelModal={d.openChannelModal}
              />

              <TagsSection
                isEditingTags={d.isEditingTags}
                setIsEditingTags={d.setIsEditingTags}
                tagInput={d.tagInput}
                setTagInput={d.setTagInput}
                tagList={d.tagList}
                updateField={d.updateField}
              />

            </s-stack>
          </div>
        </div>
      </s-query-container>

      <SalesChannelsModal
        modalRef={d.channelModalRef}
        channelSearch={d.channelSearch}
        setChannelSearch={d.setChannelSearch}
        showOnlySelected={d.showOnlySelected}
        setShowOnlySelected={d.setShowOnlySelected}
        tempSelectedChannels={d.tempSelectedChannels}
        filteredChannels={d.filteredChannels}
        isAllFilteredSelected={d.isAllFilteredSelected}
        onToggleSelectAll={d.handleToggleSelectAll}
        onToggleChannel={d.handleToggleChannel}
        onSave={d.handleSaveChannels}
        onClose={d.closeChannelModal}
        onAfterHide={d.handleAfterHide}
      />

      <SelectCountriesModal
        modalRef={d.countryModalRef}
        countrySearch={d.countrySearch}
        setCountrySearch={d.setCountrySearch}
        showOnlySelectedCountries={d.showOnlySelectedCountries}
        setShowOnlySelectedCountries={d.setShowOnlySelectedCountries}
        tempSelectedCountries={d.tempSelectedCountries}
        filteredCountries={d.filteredCountries}
        isAllFilteredCountriesSelected={d.isAllFilteredCountriesSelected}
        onToggleSelectAll={d.handleToggleSelectAllCountries}
        onToggleCountry={d.handleToggleCountry}
        onSave={d.handleSaveCountries}
        onClose={d.closeCountryModal}
        onAfterHide={d.handleAfterHideCountries}
      />

      {d.editingProduct && (
        <EditVariantsModal
          modalRef={d.variantModalRef}
          editingProduct={d.editingProduct}
          tempVariants={d.tempVariants}
          setTempVariants={d.setTempVariants}
          onToggleVariant={d.handleToggleVariant}
          onSave={d.handleSaveVariants}
          onClose={() => d.setEditingProduct(null)}
        />
      )}

      <BrowseSelectModal
        id="eligibility-browse-select-modal"
        heading={
          d.activeType === "markets"
            ? "Select markets"
            : d.activeType === "segments"
            ? "Select customer segments"
            : "Select customers"
        }
        modalRef={d.eligibilityModalRef}
        search={d.eligibilitySearchQuery}
        setSearch={d.setEligibilitySearchQuery}
        showOnlySelected={d.showOnlySelectedEligibility}
        setShowOnlySelected={d.setShowOnlySelectedEligibility}
        tempSelected={d.tempEligibilitySelection}
        filteredItems={d.filteredEligibilityItems}
        isAllSelected={d.isAllEligibilitySelected}
        onToggleSelectAll={d.handleToggleSelectAllEligibility}
        onToggleItem={d.handleToggleEligibilityItem}
        onSave={d.handleSaveEligibility}
        onClose={d.closeEligibilityModal}
        onAfterHide={d.handleAfterHideEligibility}
        loading={d.eligibilityLoading}
        icon={d.activeType === "markets" ? "globe" : d.activeType === "segments" ? "customers" : "customer"}
        itemSubtitle={d.activeType === "markets" ? "Market" : d.activeType === "segments" ? "Segment" : ""}
      />
    </s-page>
  );
}
