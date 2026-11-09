<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NSelect, NTag } from 'naive-ui';

type Project = { id: string; name: string; area: number; schemeType: string; progress?: number; currentStage?: string };

const props = withDefaults(defineProps<{
  embedded?: boolean;
  projectId: string;
  project?: Project;
  versions: any[];
  packages: any[];
  attachments: any[];
  floorplanAssists: any[];
  busy?: boolean;
}>(), { embedded: false, busy: false });
const emit = defineEmits<{
  createDelivery: [];
  uploadAttachment: [file: File, category: string];
  updateAttachmentCategory: [attachmentId: string, category: string];
  assistFloorplan: [attachmentId: string];
}>();

// 设计版本已收敛到「设计方案详情 → 历史版本」与项目页的「关联方案与报价」清单，
// 这里只承载交付物（施工成果 / 项目文件 / 交付包），避免同一批版本在项目页出现两次。
const activeTab = ref<'artifacts' | 'files' | 'packages'>('artifacts');
// 附件分类由上传人选择，不再用 mime 猜；户型候选也必须挂在一张已上传的户型图上。
const ATTACHMENT_CATEGORIES = ['户型图', '现场照片', '合同资料', '报价资料', '其他'];
const categoryOptions = ATTACHMENT_CATEGORIES.map(value => ({ label: value, value }));
const uploadCategory = ref('现场照片');
const assistAttachmentId = ref('');
const imageAttachments = computed(() => props.attachments.filter(item => String(item.mime || '').startsWith('image/')));
const assistOptions = computed(() => imageAttachments.value.map(item => ({ label: `${item.name}${item.category ? ` · ${item.category}` : ''}`, value: item.id })));
const artifacts = [
  { key: 'overview', title: '设备总览图', description: '按空间汇总品牌、型号、数量、点位状态', format: '图纸 / CSV' },
  { key: 'points', title: '智能点位图', description: '坐标、安装面、高度、规则命中与待处理原因', format: '图纸 / CSV' },
  { key: 'lighting', title: '灯光交底图', description: '灯具、障碍物、光效、控制组和回路', format: '图纸 / CSV' },
  { key: 'water', title: '水电交底图', description: '供电、底盒、开孔、安装高度与现场备注', format: '图纸' },
  { key: 'network', title: '网络布线图', description: '弱电箱、交换机、AP、网关和控制链路', format: '图纸 / CSV' },
  { key: 'woodwork', title: '木工交底图', description: '柜体灯带、窗帘盒、检修口与收口条件', format: '图纸' },
];
const dateTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—';
const fileSize = (size: number) => size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(size / 1024))}KB`;
const pick = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('uploadAttachment', file, uploadCategory.value);
  input.value = '';
};
const requestAssist = () => {
  if (!assistAttachmentId.value) return;
  emit('assistFloorplan', assistAttachmentId.value);
};
// 复核：把这张户型图作为底图带进工作台，比例尺与墙体仍由设计师人工校准。
const reviewAssist = (item: any) => {
  const params = new URLSearchParams({ project: props.projectId, restore: '1' });
  if (item.attachmentId) params.set('bg', item.attachmentId);
  window.open(`/app/?${params.toString()}`, '_blank', 'noopener');
};
const openArtifact = (key: string) => {
  if (!props.projectId) return;
  window.open(`/app/?project=${props.projectId}&restore=1&rtab=${key === 'network' ? 'circuit' : 'smart'}`, '_blank', 'noopener');
};
</script>

<template>
  <section class="design-delivery-workspace">
    <section class="panel design-delivery-panel">
      <div class="panel-head design-delivery-head">
        <div><h3>项目资料</h3></div>
        <span class="panel-note">施工成果、项目文件与离线交付包</span>
      </div>

      <div class="admin-tabs design-delivery-tabs">
        <button :class="{active:activeTab==='artifacts'}" @click="activeTab='artifacts'">施工成果</button>
        <button :class="{active:activeTab==='files'}" @click="activeTab='files'">项目文件</button>
        <button :class="{active:activeTab==='packages'}" @click="activeTab='packages'">交付包</button>
      </div>

      <section v-if="activeTab==='artifacts'" class="design-delivery-section">
        <div class="design-delivery-section-head"><strong>施工成果</strong><span>图表口径与当前设计版本保持一致</span></div>
      <div class="design-table-wrap">
        <table class="design-list-table artifacts-table">
          <thead><tr><th>成果</th><th>包含内容</th><th>输出格式</th><th>当前口径</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="artifact in artifacts" :key="artifact.key">
              <td><strong>{{ artifact.title }}</strong><small>{{ artifact.key }}</small></td>
              <td>{{ artifact.description }}</td><td>{{ artifact.format }}</td>
              <td><NTag size="small" :type="versions.length ? 'success' : 'default'" :bordered="false">{{ versions.length ? '可基于已存版本查看' : '等待设计版本' }}</NTag></td>
              <td><button class="table-link" :disabled="!versions.length" @click="openArtifact(artifact.key)">打开成果</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      </section>

      <div v-else-if="activeTab==='files'" class="design-file-grid">
      <section class="design-delivery-section">
        <div class="design-delivery-section-head">
          <strong>户型图、合同与现场照片</strong>
          <div class="design-upload-line">
            <span>上传分类</span>
            <NSelect v-model:value="uploadCategory" size="small" :options="categoryOptions" class="design-upload-category" />
            <label class="secondary link-button file-button">选择文件上传<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" @change="pick"></label>
          </div>
        </div>
        <div class="design-table-wrap">
          <table class="design-list-table"><thead><tr><th>文件</th><th>分类</th><th>大小</th><th>上传时间</th><th>操作</th></tr></thead><tbody>
            <tr v-for="item in attachments" :key="item.id"><td><strong>{{ item.name }}</strong><small>{{ item.id }}</small></td><td><NSelect size="small" :value="item.category" :options="categoryOptions" class="design-attachment-category" :title="'修改附件分类'" @update:value="value => emit('updateAttachmentCategory', item.id, value)" /></td><td>{{ fileSize(item.size) }}</td><td>{{ dateTime(item.createdAt) }}</td><td><a class="table-link" :href="item.url" target="_blank" rel="noopener">查看</a></td></tr>
            <tr v-if="!attachments.length"><td colspan="5"><div class="empty">还没有项目附件。</div></td></tr>
          </tbody></table>
        </div>
      </section>
      <section class="design-delivery-section">
        <div class="design-delivery-section-head">
          <strong>户型空间候选（启发式 Demo）</strong>
          <div class="design-upload-line">
            <NSelect v-model:value="assistAttachmentId" size="small" :options="assistOptions" class="design-upload-category" placeholder="选择已上传的户型图" clearable />
            <NButton size="small" :disabled="!assistAttachmentId" @click="requestAssist">生成空间候选</NButton>
          </div>
        </div>
        <div class="design-table-wrap">
          <table class="design-list-table"><thead><tr><th>户型图</th><th>候选空间</th><th>启发式匹配度</th><th>状态</th><th>操作</th></tr></thead><tbody>
            <tr v-for="item in floorplanAssists" :key="item.id">
              <td><strong>{{ item.fileName }}</strong><small>{{ dateTime(item.createdAt) }} · {{ item.method === 'local_heuristic_demo' ? '本地启发式（非图像识别）' : item.method }}</small></td>
              <td>{{ item.rooms.map((room:any)=>room.name).join('、') }}</td>
              <td><span :title="'按图片长宽比与项目面积推算，仅用于排序，不代表识别准确率'">{{ Math.round(item.confidence*100) }}%</span></td>
              <td><NTag size="small" type="warning" :bordered="false">{{ item.status }}</NTag></td>
              <td><div class="table-actions">
                <a v-if="item.imageUrl" class="table-link" :href="item.imageUrl" target="_blank" rel="noopener">查看户型图</a>
                <button type="button" class="table-link" :disabled="!item.attachmentId" :title="item.attachmentId ? '带底图进入工作台人工框选' : '该候选没有关联图片，无法带底图复核'" @click="reviewAssist(item)">去工作台框选</button>
              </div></td>
            </tr>
            <tr v-if="!floorplanAssists.length"><td colspan="5"><div class="empty">还没有候选。先在上方选择一张已上传的户型图，再点「生成空间候选」。</div></td></tr>
          </tbody></table>
        </div>
        <p class="design-panel-hint">候选空间按项目面积与房型生成，不是图像识别；匹配度由图片长宽比推算。复核时底图仅作描图参考，墙体、门窗与比例尺必须在工作台人工校准。</p>
      </section>
      </div>

      <section v-else class="design-delivery-section">
      <div class="design-delivery-section-head"><strong>交付包</strong><NButton type="primary" size="small" :disabled="!versions.length" :loading="busy" @click="emit('createDelivery')">生成施工交付包</NButton></div>
      <div class="design-table-wrap">
        <table class="design-list-table">
          <thead><tr><th>交付包</th><th>可下载成果</th><th>状态</th><th>生成时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in packages" :key="item.id">
              <td><strong>{{ item.name }}</strong><small>{{ item.id }}</small></td>
              <td>{{ item.manifest.artifacts.filter((artifact:any)=>artifact.status==='已生成' && artifact.size>0).length }} 类文件</td>
              <td><NTag size="small" :type="item.status==='已生成'?'success':'default'" :bordered="false">{{ item.status }}</NTag></td>
              <td>{{ dateTime(item.createdAt) }}</td>
              <td><a class="table-link" :href="`/api/admin/delivery-packages/${item.id}/download`">下载整包</a></td>
            </tr>
            <tr v-if="!packages.length"><td colspan="5"><div class="empty">保存设计版本后可生成离线交付包。</div></td></tr>
          </tbody>
        </table>
      </div>
      </section>
    </section>
  </section>
</template>
