import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { DEFAULT_CHANNELS } from "../../constants/discounts";

export function useSalesChannels(selectedChannels, updateField) {
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [tempSelectedChannels, setTempSelectedChannels] = useState([]);
  const channelModalRef = useRef(null);

  useEffect(() => {
    const modal = channelModalRef.current;
    if (!modal) return;
    if (isChannelModalOpen) {
      modal.showOverlay?.();
    } else {
      modal.hideOverlay?.();
    }
  }, [isChannelModalOpen]);

  const openChannelModal = useCallback(() => {
    setTempSelectedChannels([...(selectedChannels || [])]);
    setChannelSearch("");
    setShowOnlySelected(false);
    setIsChannelModalOpen(true);
  }, [selectedChannels]);

  const closeChannelModal = useCallback(() => {
    setIsChannelModalOpen(false);
  }, []);

  const handleAfterHide = useCallback(() => {
    setIsChannelModalOpen(false);
  }, []);

  const handleSaveChannels = useCallback(() => {
    updateField("selectedChannels", tempSelectedChannels);
    setIsChannelModalOpen(false);
  }, [tempSelectedChannels, updateField]);

  const handleToggleChannel = useCallback((channelId) => {
    setTempSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  }, []);

  const filteredChannels = useMemo(() => {
    return DEFAULT_CHANNELS.filter((channel) => {
      const matchesSearch = channel.name.toLowerCase().includes(channelSearch.toLowerCase());
      const matchesSelected = !showOnlySelected || tempSelectedChannels.includes(channel.id);
      return matchesSearch && matchesSelected;
    });
  }, [channelSearch, showOnlySelected, tempSelectedChannels]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredChannels.length === 0) return false;
    return filteredChannels.every((channel) => tempSelectedChannels.includes(channel.id));
  }, [filteredChannels, tempSelectedChannels]);

  const handleToggleSelectAll = useCallback(() => {
    const ids = filteredChannels.map((channel) => channel.id);
    setTempSelectedChannels((prev) =>
      isAllFilteredSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    );
  }, [isAllFilteredSelected, filteredChannels]);

  return {
    isChannelModalOpen,
    channelSearch,
    setChannelSearch,
    showOnlySelected,
    setShowOnlySelected,
    tempSelectedChannels,
    channelModalRef,
    filteredChannels,
    isAllFilteredSelected,
    openChannelModal,
    closeChannelModal,
    handleAfterHide,
    handleSaveChannels,
    handleToggleChannel,
    handleToggleSelectAll,
  };
}
